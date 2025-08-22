defmodule Pglite do
  use GenServer
  require Logger

  defstruct [
    :bun_executable,
    :bun_port,
    :data_dir,
    :opts,
    :postgrex_conn,
    :script_path,
    :socket_path,
    :timeout,
    :memory?
  ]

  @type t :: %__MODULE__{
          bun_executable: String.t(),
          bun_port: port(),
          data_dir: String.t(),
          opts: Postgrex.start_option(),
          postgrex_conn: pid(),
          script_path: String.t(),
          socket_path: String.t(),
          timeout: non_neg_integer(),
          memory?: boolean()
        }

  @spec start_link(keyword()) :: {:ok, {pid(), pid()}} | {:error, term()}
  def start_link(opts \\ []) do
    {gen_opts, init_opts} = Keyword.split(opts, [:name])
    init_opts = Keyword.put_new(init_opts, :timeout, 3_000)

    case GenServer.start_link(__MODULE__, init_opts, gen_opts) do
      {:ok, manager_pid} ->
        postgrex_pid = GenServer.call(manager_pid, :get_postgrex_connection)
        {:ok, {manager_pid, postgrex_pid}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @spec health_check(pid()) :: {:ok, :healthy} | {:error, term()}
  def health_check(connection) do
    case Postgrex.query(connection, "SELECT 1", []) do
      {:ok, _result} -> {:ok, :healthy}
      {:error, reason} -> {:error, reason}
    end
  end

  def init(opts) do
    Process.flag(:trap_exit, true)
    # Check for bun executable early and fail if not found
    bun_executable = Keyword.get(opts, :bun_executable, System.find_executable("bun"))

    if !bun_executable do
      Logger.error("bun executable not found in PATH. Please install bun: https://bun.sh/")
      {:stop, :bun_not_found}
    end

    # Use unique socket paths to avoid conflicts between tests
    socket_dir = Path.join("tmp", "pglite_sockets_#{System.unique_integer([:positive])}")
    File.mkdir_p!(socket_dir)
    socket_path = Path.join(socket_dir, "pglite_#{System.unique_integer([:positive])}.sock")

    timeout = Keyword.get(opts, :timeout, 5000)
    memory? = Keyword.get(opts, :memory, true)
    random_data_dir = :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
    data_dir = Keyword.get(opts, :data_dir, "tmp/" <> random_data_dir)
    data_dir = if memory?, do: "memory://#{data_dir}", else: data_dir
    opts = Keyword.get(opts, :opts, [])
    opts = Keyword.merge([database: "postgres", username: "postgres", password: "postgres"], opts)
    script_path = Keyword.get(opts, :script_path, "priv/bun/pglite_socket_server.ts")

    state = %__MODULE__{
      bun_executable: bun_executable,
      data_dir: data_dir,
      timeout: timeout,
      opts: opts,
      script_path: script_path,
      socket_path: socket_path
    }

    case start_pglite_socket_server(state) do
      {:ok, socket_path, bun_port} ->
        case connect_postgrex(state) do
          {:ok, postgrex_conn} ->
            Process.link(postgrex_conn)
            Port.monitor(bun_port)

            state = %{
              state
              | bun_port: bun_port,
                postgrex_conn: postgrex_conn,
                socket_path: socket_path
            }

            Logger.info("Connected to PGLite socket server via Postgrex: #{socket_path}")
            {:ok, state}

          {:error, reason} ->
            Logger.error("Failed to connect to PGLite socket server: #{inspect(reason)}")
            {:stop, reason}
        end

      {:error, reason} ->
        Logger.error("Failed to start PGLite socket server: #{inspect(reason)}")
        {:stop, reason}
    end
  end

  def handle_call(:get_postgrex_connection, _from, state), do: {:reply, state.postgrex_conn, state}

  def handle_info({port, {:exit_status, status}}, %{bun_port: port} = state) do
    Logger.error("PGLite socket server process exited with status: #{status}")
    {:stop, {:pglite_exit, status}, state}
  end

  def handle_info({:EXIT, pid, reason}, %{postgrex_conn: pid} = state) do
    Logger.error("Postgrex connection exited: #{inspect(reason)}")
    {:stop, {:postgrex_exit, reason}, %{state | postgrex_conn: nil}}
  end

  def handle_info(_msg, state), do: {:noreply, state}

  def terminate(reason, state) do
    %{bun_port: bun_port, socket_path: socket_path, postgrex_conn: postgrex_conn} = state
    Logger.info("Terminating PGLite socket connection: #{inspect(reason)}")
    if postgrex_conn && Process.alive?(postgrex_conn), do: GenServer.stop(postgrex_conn)

    if bun_port do
      {:os_pid, os_pid} = Port.info(bun_port, :os_pid)
      System.cmd("kill", ["-2", Integer.to_string(os_pid)])
    end

    if socket_path, do: File.rm(socket_path)

    :ok
  catch
    _, reason ->
      Logger.error("Error terminating PGLite socket connection: #{inspect(reason)}")
      :ok
  end

  defp start_pglite_socket_server(state) do
    %{
      data_dir: data_dir,
      timeout: timeout,
      bun_executable: bun_executable,
      opts: opts,
      socket_path: socket_path,
      script_path: script_path
    } = state

    # Ensure directories exist
    socket_dir = Path.dirname(socket_path)
    data_dir_path = if String.starts_with?(data_dir, "memory://"), do: nil, else: data_dir
    File.mkdir_p!(socket_dir)
    if data_dir_path, do: File.mkdir_p!(data_dir_path)
    opts_json = opts |> Map.new() |> Jason.encode!()

    bun_command = "#{bun_executable} --smol --no-error-format #{script_path} #{socket_path} #{data_dir} '#{opts_json}'"

    port = Port.open({:spawn, bun_command}, [:binary, :exit_status, {:line, 1024}])

    case wait_for_ready_signal(port, socket_path, timeout) do
      {:ok, socket_path} -> {:ok, socket_path, port}
      {:error, reason} -> {:error, reason}
    end
  end

  defp wait_for_ready_signal(port, socket_path, timeout) do
    receive do
      {^port, {:data, {:eol, line}}} ->
        case Jason.decode(line) do
          {:ok, %{"id" => "ready", "success" => true}} -> {:ok, socket_path}
          {:ok, _other} -> wait_for_ready_signal(port, socket_path, timeout)
          {:error, _} -> wait_for_ready_signal(port, socket_path, timeout)
        end

      {^port, {:exit_status, status}} ->
        Logger.error("PGLite socket server process exited with status #{status} during startup")
        {:error, {:pglite_startup_failed, status}}
    after
      timeout ->
        Logger.error("Timeout waiting for PGLite socket server to be ready")
        {:error, :startup_timeout}
    end
  end

  defp connect_postgrex(%{socket_path: socket_path, opts: opts}) do
    postgrex_opts = Keyword.merge(opts, socket: socket_path)

    case Postgrex.start_link(postgrex_opts) do
      {:ok, conn} -> {:ok, conn}
      {:error, reason} -> {:error, reason}
    end
  end
end
