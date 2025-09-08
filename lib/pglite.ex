defmodule Pglite do
  @moduledoc """
  An Elixir wrapper for PGLite - in-memory PostgreSQL database.

  PGLite spawns PostgreSQL databases using Bun runtime and provides PostgreSQL-compatible
  connections through Unix domain sockets. Supports both in-memory and persistent databases.

  ## Basic Usage

      {:ok, pglite} = Pglite.start_link()
      conn_opts = Pglite.get_connection_opts(pglite)
      {:ok, conn} = Postgrex.start_link(conn_opts)
      {:ok, result} = Postgrex.query(conn, "SELECT 1", [])
  """

  use GenServer
  require Logger

  defstruct [
    :bun_executable,
    :bun_port,
    :data_dir,
    :connection_opts,
    :script_path,
    :socket_dir,
    :startup_timeout,
    :memory?,
    :initial_memory
  ]

  @type t :: %__MODULE__{
          bun_executable: String.t(),
          bun_port: port(),
          data_dir: String.t(),
          connection_opts: [
            database: String.t(),
            password: String.t(),
            username: String.t()
          ],
          script_path: String.t(),
          socket_dir: String.t(),
          startup_timeout: non_neg_integer(),
          memory?: boolean(),
          initial_memory: non_neg_integer() | nil
        }

  @doc """
  Starts a PGLite GenServer process.

  ## Options

  - `:name` - Process name for registration
  - `:data_dir` - Directory for persistent database files (default: random temp directory)
  - `:memory` - Use in-memory database (default: `true`)
  - `:database` - Database name (default: `"postgres"`)
  - `:username` - Database username (default: `"postgres"`)
  - `:password` - Database password (default: `"password"`)
  - `:startup_timeout` - Startup timeout in milliseconds (default: `3000`)
  - `:initial_memory` - Initial memory allocation in bytes
  - `:bun_executable` - Path to bun executable (default: searches PATH)
  - `:script_path` - Path to PGLite script (default: uses bundled script)

  ## Examples

      # Start in-memory database
      {:ok, pid} = Pglite.start_link()

      # Start persistent database
      {:ok, pid} = Pglite.start_link(
        data_dir: "/path/to/db",
        memory: false
      )

      # Start with custom configuration
      {:ok, pid} = Pglite.start_link(
        database: "myapp_db",
        username: "myuser",
        password: "mypass",
        initial_memory: 64 * 1024 * 1024  # 64MB
      )

      # Start with named process
      {:ok, pid} = Pglite.start_link(name: :my_pglite)
  """
  @spec start_link(keyword()) :: {:ok, pid()} | {:error, term()}
  def start_link(opts \\ []) do
    {gen_opts, init_opts} = Keyword.split(opts, [:name])

    GenServer.start_link(__MODULE__, init_opts, gen_opts)
  end

  @doc """
  Performs a health check by executing a simple `SELECT 1` query.

  ## Examples

      {:ok, pid} = Pglite.start_link()
      :ok = Pglite.health_check(pid)
  """
  @spec health_check(pid()) :: :ok | {:error, term()}
  def health_check(manager_pid), do: run_health_check(manager_pid)

  @doc """
  Returns socket directory information for debugging purposes.

  ## Examples

      {:ok, pid} = Pglite.start_link()
      socket_info = Pglite.get_socket_info(pid)
  """
  @spec get_socket_info(pid()) :: {:ok, String.t()} | {:error, term()}
  def get_socket_info(manager_pid), do: GenServer.call(manager_pid, :get_socket_info)

  @doc """
  Returns connection options for use with Postgrex.

  The returned options can be passed directly to `Postgrex.start_link/1` to establish
  a connection to the PGLite database.

  ## Examples

      {:ok, pid} = Pglite.start_link()
      conn_opts = Pglite.get_connection_opts(pid)
      {:ok, conn} = Postgrex.start_link(conn_opts)
  """
  @spec get_connection_opts(pid()) :: [
          database: String.t(),
          password: String.t(),
          username: String.t(),
          socket_dir: String.t()
        ]
  def get_connection_opts(manager_pid), do: GenServer.call(manager_pid, :get_connection_opts)

  def init(opts) do
    Process.flag(:trap_exit, true)
    # Check for bun executable early and fail if not found
    bun_executable = Keyword.get(opts, :bun_executable, System.find_executable("bun"))

    if !bun_executable do
      Logger.error("bun executable not found in PATH.")
      {:stop, :bun_not_found}
    end

    # Use unique socket paths to avoid conflicts between tests
    socket_dir = Path.join("tmp", "pglite_sockets_#{System.unique_integer([:positive])}")
    File.mkdir_p!(socket_dir)

    memory? = Keyword.get(opts, :memory, true)
    random_data_dir = :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
    data_dir = Keyword.get(opts, :data_dir, "tmp/" <> random_data_dir)
    data_dir = if memory?, do: "memory://#{data_dir}", else: data_dir

    script_path = Keyword.get(opts, :script_path, get_script_path())

    database = Keyword.get(opts, :database, "postgres")
    password = Keyword.get(opts, :password, "password")
    username = Keyword.get(opts, :username, "postgres")
    startup_timeout = Keyword.get(opts, :startup_timeout, 3_000)
    initial_memory = Keyword.get(opts, :initial_memory)
    connection_opts = [database: database, password: password, username: username]

    state = %__MODULE__{
      bun_executable: bun_executable,
      data_dir: data_dir,
      connection_opts: connection_opts,
      socket_dir: socket_dir,
      script_path: script_path,
      startup_timeout: startup_timeout,
      initial_memory: initial_memory
    }

    case start_pglite_socket_server(state) do
      {:ok, %{port: bun_port, socket_dir: socket_dir}} ->
        Logger.info("Starting health check")

        Port.monitor(bun_port)
        state = %{state | bun_port: bun_port, socket_dir: socket_dir}

        {:ok, state}

      {:error, reason} ->
        Logger.error("Failed to start PGLite socket server: #{inspect(reason)}")
        {:stop, reason}
    end
  end

  def handle_call(:get_socket_info, _from, state),
    do: {:reply, %{socket_dir: state.socket_dir, socket_path: state.socket_path, port: state.bun_port}, state}

  def handle_call(:get_connection_opts, _from, state) do
    opts = Keyword.put(state.connection_opts, :socket_dir, state.socket_dir)

    {:reply, opts, state}
  end

  def handle_info({port, {:exit_status, status}}, %{bun_port: port} = state) do
    Logger.error("PGLite socket server process exited with status: #{status}")
    {:stop, {:ex_pglite_exit, status}, state}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  def terminate(reason, state) do
    %{bun_port: bun_port, socket_dir: socket_dir} = state
    Logger.info("Terminating PGLite socket connection: #{inspect(reason)}")

    if bun_port do
      {:os_pid, os_pid} = Port.info(bun_port, :os_pid)
      System.cmd("kill", ["-2", Integer.to_string(os_pid)])
    end

    if socket_dir, do: File.rm(socket_dir)

    :ok
  catch
    _, reason ->
      Logger.error("Error terminating PGLite socket connection: #{inspect(reason)}")
      :ok
  end

  defp start_pglite_socket_server(state) do
    Logger.info("Starting PGLite socket server")

    %{
      data_dir: data_dir,
      startup_timeout: startup_timeout,
      bun_executable: bun_executable,
      connection_opts: connection_opts,
      socket_dir: socket_dir,
      script_path: script_path,
      initial_memory: initial_memory
    } = state

    data_dir_path = if String.starts_with?(data_dir, "memory://"), do: nil, else: data_dir
    File.mkdir_p!(socket_dir)
    if data_dir_path, do: File.mkdir_p!(data_dir_path)

    all_opts =
      if initial_memory,
        do: connection_opts ++ [initial_memory: initial_memory],
        else: connection_opts

    opts_json = all_opts |> Map.new() |> Jason.encode!()
    Logger.info("Starting PGLite socket server with opts: #{inspect(opts_json)}")

    bun_command =
      "#{bun_executable} --smol --no-error-format #{script_path} #{socket_dir} #{data_dir} '#{opts_json}'"

    Logger.info("Starting PGLite socket server with bun command: #{bun_command}")
    port = Port.open({:spawn, bun_command}, [:binary, :exit_status, {:line, 1024}])

    case wait_for_ready_signal(port, startup_timeout) do
      :ok -> {:ok, %{port: port, socket_dir: socket_dir}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp wait_for_ready_signal(port, startup_timeout) do
    receive do
      {^port, {:data, {:eol, line}}} ->
        case Jason.decode(line) do
          {:ok, %{"id" => "ready", "success" => true}} -> :ok
          {:ok, _other} -> wait_for_ready_signal(port, startup_timeout)
          {:error, _} -> wait_for_ready_signal(port, startup_timeout)
        end

      {^port, {:exit_status, status}} ->
        Logger.error("PGLite socket server process exited with status #{status} during startup")
        {:error, {:ex_pglite_startup_failed, status}}
    after
      startup_timeout ->
        Logger.error("Timeout waiting for PGLite socket server to be ready")
        {:error, :startup_timeout}
    end
  end

  defp get_script_path do
    script_path = Application.app_dir(:ex_pglite, "priv/pglite/index.js")
    if File.exists?(script_path), do: script_path, else: "priv/bun/index.ts"
  end

  defp run_health_check(manager_pid) when is_pid(manager_pid) do
    with connection_opts <- GenServer.call(manager_pid, :get_connection_opts),
         {:ok, conn} <- Postgrex.start_link(connection_opts),
         {:ok, _result} <- Postgrex.query(conn, "SELECT 1", []) do
      GenServer.stop(conn)

      Logger.info("Health check passed")
      :ok
    end
  end
end
