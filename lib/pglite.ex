defmodule Pglite do
  @moduledoc """
  Runs PostgreSQL in-process using PGlite (PostgreSQL compiled to WebAssembly).

  Uses pglited - a Rust binary with Wasmtime that runs the PostgreSQL WASM module.
  The pglited binary has all assets embedded, making it fully self-contained.
  Exposes a TCP socket on localhost for Postgrex connections.

  ## Usage

      {:ok, pglite} = Pglite.start_link()
      {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
      {:ok, result} = Postgrex.query(conn, "SELECT 1", [])
  """

  use GenServer
  require Logger

  @kill_grace_period_ms 100

  defstruct [
    :port,
    :port_binary,
    :data_dir,
    :tcp_port,
    :connection_opts,
    :startup_timeout,
    :multiplexer
  ]

  @type t :: %__MODULE__{
          port: port(),
          port_binary: String.t(),
          data_dir: String.t(),
          tcp_port: integer(),
          connection_opts: keyword(),
          startup_timeout: non_neg_integer(),
          multiplexer: boolean()
        }

  @doc """
  Starts a PGlite instance.

  ## Options

  - `:memory` - Use in-memory storage (default: `true`)
  - `:data_dir` - Directory for persistent files (default: random temp dir)
  - `:tcp_port` - TCP port for connections (default: `54321`)
  - `:database` - Database name (default: `"postgres"`)
  - `:username` - Username (default: `"postgres"`)
  - `:password` - Password (default: `"password"`)
  - `:startup_timeout` - Timeout in ms (default: `60_000`)
  - `:name` - Process name for registration
  - `:multiplexer` - Enable connection multiplexer: `true`, `false` (default: `true`)

  ## Examples

      {:ok, pid} = Pglite.start_link()
      {:ok, pid} = Pglite.start_link(memory: false, data_dir: "/path/to/db")
      {:ok, pid} = Pglite.start_link(tcp_port: 54322, name: :my_db)
  """
  @spec start_link(keyword()) :: {:ok, pid()} | {:error, term()}
  def start_link(opts \\ []) do
    {gen_opts, init_opts} = Keyword.split(opts, [:name])
    GenServer.start_link(__MODULE__, init_opts, gen_opts)
  end

  @doc """
  Runs a health check by executing `SELECT 1`. Returns `:ok` or `{:error, reason}`.
  """
  @spec health_check(pid()) :: :ok | {:error, term()}
  def health_check(pid) do
    conn_opts = get_connection_opts(pid)

    with {:ok, conn} <- Postgrex.start_link(conn_opts),
         {:ok, _} <- Postgrex.query(conn, "SELECT 1", []) do
      GenServer.stop(conn)
      :ok
    end
  end

  @doc """
  Returns Postgrex connection options for this instance.
  """
  @spec get_connection_opts(pid()) :: keyword()
  def get_connection_opts(pid), do: GenServer.call(pid, :get_connection_opts)

  @impl true
  def init(opts) do
    Process.flag(:trap_exit, true)

    port_binary = Keyword.get(opts, :port_binary, get_port_binary_path())

    case validate_binary(port_binary) do
      :ok ->
        state = build_state(opts, port_binary)
        initialize_port(state)

      {:error, reason} ->
        {:stop, reason}
    end
  end

  @impl true
  def handle_call(:get_connection_opts, _from, state) do
    {:reply, state.connection_opts, state}
  end

  @impl true
  def handle_info({port, {:exit_status, status}}, %{port: port} = state) do
    {:stop, {:port_exit, status}, state}
  end

  def handle_info({:DOWN, _ref, :port, port, reason}, %{port: port} = state) do
    {:stop, {:port_down, reason}, state}
  end

  def handle_info(msg, state) do
    Logger.debug("Unexpected message received: #{inspect(msg)}")
    {:noreply, state}
  end

  @impl true
  def terminate(_reason, state) do
    if state.port, do: cleanup_port(state.port)
    :ok
  catch
    kind, error ->
      Logger.warning("Cleanup error during terminate: #{inspect({kind, error})}")
      :ok
  end

  # Private functions

  defp validate_binary(port_binary) do
    if File.exists?(port_binary) do
      :ok
    else
      Logger.error("pglited binary not found at: #{port_binary}")
      {:error, :port_binary_not_found}
    end
  end

  defp initialize_port(state) do
    case start_port(state) do
      {:ok, port} ->
        Port.monitor(port)
        {:ok, %{state | port: port}}

      {:error, reason} ->
        {:stop, reason}
    end
  end

  defp build_state(opts, port_binary) do
    data_dir = resolve_data_dir(opts)
    tcp_port = Keyword.get(opts, :tcp_port, 54_321)

    %__MODULE__{
      port_binary: port_binary,
      data_dir: data_dir,
      tcp_port: tcp_port,
      connection_opts: build_connection_opts(opts, tcp_port),
      startup_timeout: Keyword.get(opts, :startup_timeout, 60_000),
      multiplexer: Keyword.get(opts, :multiplexer, true)
    }
  end

  defp resolve_data_dir(opts) do
    memory? = Keyword.get(opts, :memory, true)
    random_id = :crypto.strong_rand_bytes(8) |> Base.encode16(case: :lower)
    data_dir = Keyword.get(opts, :data_dir, "tmp/#{random_id}")
    data_dir = if memory?, do: "memory://#{data_dir}", else: data_dir

    unless String.starts_with?(data_dir, "memory://"), do: File.mkdir_p!(data_dir)

    data_dir
  end

  defp build_connection_opts(opts, tcp_port) do
    [
      database: Keyword.get(opts, :database, "postgres"),
      password: Keyword.get(opts, :password, "password"),
      username: Keyword.get(opts, :username, "postgres"),
      hostname: "127.0.0.1",
      port: tcp_port,
      ssl: false
    ]
  end

  defp start_port(state) do
    args = [state.data_dir, Integer.to_string(state.tcp_port)]

    args =
      if state.multiplexer do
        args ++ ["--multiplexer", "queue"]
      else
        args
      end

    port =
      Port.open({:spawn_executable, state.port_binary}, [
        {:args, args},
        :binary,
        :exit_status,
        {:line, 1024},
        :stderr_to_stdout
      ])

    case wait_for_ready(port, state.startup_timeout) do
      :ok ->
        {:ok, port}

      {:error, reason} ->
        cleanup_port(port)
        {:error, reason}
    end
  end

  defp wait_for_ready(port, timeout) do
    deadline = System.monotonic_time(:millisecond) + timeout
    do_wait_for_ready(port, deadline)
  end

  defp do_wait_for_ready(port, deadline) do
    remaining = deadline - System.monotonic_time(:millisecond)

    if remaining <= 0 do
      {:error, :startup_timeout}
    else
      receive do
        {^port, {:data, {:eol, line}}} ->
          case Jason.decode(line) do
            {:ok, %{"id" => "ready", "success" => true}} -> :ok
            _ -> do_wait_for_ready(port, deadline)
          end

        {^port, {:data, _}} ->
          do_wait_for_ready(port, deadline)

        {^port, {:exit_status, status}} ->
          {:error, {:startup_failed, status}}
      after
        min(1000, remaining) ->
          do_wait_for_ready(port, deadline)
      end
    end
  end

  defp cleanup_port(port) do
    case Port.info(port, :os_pid) do
      {:os_pid, os_pid} ->
        pid_str = Integer.to_string(os_pid)
        System.cmd("kill", ["-TERM", pid_str], stderr_to_stdout: true)
        Process.sleep(@kill_grace_period_ms)

        case System.cmd("ps", ["-p", pid_str], stderr_to_stdout: true) do
          {_, 0} -> System.cmd("kill", ["-KILL", pid_str], stderr_to_stdout: true)
          _ -> :ok
        end

      nil ->
        :ok
    end

    if Port.info(port) != nil, do: Port.close(port)
    :ok
  catch
    _, _ -> :ok
  end

  defp get_port_binary_path do
    priv_path = Application.app_dir(:ex_pglite, "priv/bin/pglited")
    if File.exists?(priv_path), do: priv_path, else: "priv/bin/pglited"
  end
end
