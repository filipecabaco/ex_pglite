defmodule Pglite do
  @moduledoc """
  Runs PostgreSQL in-process using PGlite (PostgreSQL compiled to WebAssembly).

  Uses a Rust binary with Wasmtime to run the PostgreSQL WASM module.
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
    :cwasm_path,
    :prefix_dir,
    :data_dir,
    :tcp_port,
    :connection_opts,
    :startup_timeout,
    :isolated_dir,
    :pgdata_seed_path,
    :multiplexer
  ]

  @type t :: %__MODULE__{
          port: port(),
          port_binary: String.t(),
          cwasm_path: String.t(),
          prefix_dir: String.t(),
          data_dir: String.t(),
          tcp_port: integer(),
          connection_opts: keyword(),
          startup_timeout: non_neg_integer(),
          isolated_dir: String.t() | nil,
          pgdata_seed_path: String.t() | nil,
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
  - `:isolate` - Create isolated prefix directory with own WASM copy (default: `true`)
  - `:pgdata_seed_path` - Path to pre-initialized PGDATA tarball for faster startup (optional)
  - `:multiplexer` - Enable connection multiplexer: `true`, `false` (default: `true`)

  ## Examples

      {:ok, pid} = Pglite.start_link()
      {:ok, pid} = Pglite.start_link(memory: false, data_dir: "/path/to/db")
      {:ok, pid} = Pglite.start_link(tcp_port: 54322, name: :my_db)
      {:ok, pid} = Pglite.start_link(pgdata_seed_path: "priv/pgdata_seed.tar.zst")
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
    isolate? = Keyword.get(opts, :isolate, true)

    {cwasm_path, prefix_dir, isolated_dir} =
      if isolate? do
        setup_isolated_instance(opts)
      else
        {
          Keyword.get(opts, :cwasm_path, get_cwasm_path()),
          Keyword.get(opts, :prefix_dir, get_prefix_dir()),
          nil
        }
      end

    case validate_paths(port_binary, cwasm_path) do
      :ok ->
        state = build_state(opts, port_binary, cwasm_path, prefix_dir, isolated_dir)
        initialize_port(state)

      {:error, reason} ->
        if isolated_dir, do: File.rm_rf(isolated_dir)
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
    if state.isolated_dir, do: File.rm_rf(state.isolated_dir)
    :ok
  catch
    kind, error ->
      Logger.warning("Cleanup error during terminate: #{inspect({kind, error})}")
      :ok
  end

  # Private functions

  defp validate_paths(port_binary, cwasm_path) do
    cond do
      not File.exists?(port_binary) ->
        Logger.error("pglite_port binary not found at: #{port_binary}")
        {:error, :port_binary_not_found}

      not File.exists?(cwasm_path) ->
        Logger.error("Pre-compiled WASM module not found at: #{cwasm_path}.")
        {:error, :cwasm_not_found}

      true ->
        :ok
    end
  end

  defp initialize_port(state) do
    case start_port(state) do
      {:ok, port} ->
        Port.monitor(port)
        {:ok, %{state | port: port}}

      {:error, reason} ->
        if state.isolated_dir, do: File.rm_rf(state.isolated_dir)
        {:stop, reason}
    end
  end

  defp build_state(opts, port_binary, cwasm_path, prefix_dir, isolated_dir) do
    data_dir = resolve_data_dir(opts)
    tcp_port = Keyword.get(opts, :tcp_port, 54_321)

    %__MODULE__{
      port_binary: port_binary,
      cwasm_path: cwasm_path,
      prefix_dir: prefix_dir,
      data_dir: data_dir,
      tcp_port: tcp_port,
      connection_opts: build_connection_opts(opts, tcp_port),
      startup_timeout: Keyword.get(opts, :startup_timeout, 60_000),
      isolated_dir: isolated_dir,
      pgdata_seed_path: Keyword.get(opts, :pgdata_seed_path, get_pgdata_seed_path()),
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
    args = [state.data_dir, Integer.to_string(state.tcp_port), state.cwasm_path, state.prefix_dir]

    args =
      if state.pgdata_seed_path do
        args ++ [state.pgdata_seed_path]
      else
        args
      end

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

  defp resolve_priv_path(relative_path, fallback) do
    priv_path = Application.app_dir(:ex_pglite, relative_path)
    if File.exists?(priv_path), do: priv_path, else: fallback
  end

  defp get_port_binary_path do
    priv_mux_path = Application.app_dir(:ex_pglite, "priv/bin/pglite_port.mux")

    if File.exists?(priv_mux_path) do
      priv_mux_path
    else
      resolve_priv_path("priv/bin/pglite_port", "priv/bin/pglite_port")
    end
  end

  defp get_cwasm_path do
    resolve_priv_path("priv/pglite.cwasm", "priv/pglite.cwasm")
  end

  defp get_prefix_dir do
    resolve_priv_path("priv/pglite_prefix", "priv/pglite_prefix")
  end

  defp get_pgdata_seed_path do
    priv_path = Application.app_dir(:ex_pglite, "priv/pgdata_seed.tar.zst")
    dev_path = "priv/pgdata_seed.tar.zst"

    cond do
      File.exists?(priv_path) -> priv_path
      File.exists?(dev_path) -> dev_path
      true -> nil
    end
  end

  defp setup_isolated_instance(opts) do
    unique_id = System.unique_integer([:positive])
    isolated_dir = Path.join(System.tmp_dir!(), "pglite_isolated_#{unique_id}")
    File.mkdir_p!(isolated_dir)

    source_cwasm = Keyword.get(opts, :cwasm_path, get_cwasm_path())
    source_prefix = Keyword.get(opts, :prefix_dir, get_prefix_dir())

    dest_prefix = Path.join(isolated_dir, "prefix")

    if File.exists?(source_prefix) do
      copy_prefix_directory(source_prefix, dest_prefix)
    else
      File.mkdir_p!(Path.join(dest_prefix, "tmp/pglite/share/postgresql"))
    end

    dest_cwasm = Path.join(isolated_dir, "pglite.cwasm")
    if File.exists?(source_cwasm), do: copy_file(source_cwasm, dest_cwasm)

    {dest_cwasm, dest_prefix, isolated_dir}
  end

  defp copy_file(source, dest) do
    if Path.expand(source) == Path.expand(dest) do
      raise "Cannot copy file to itself: #{source}"
    end

    File.cp!(source, dest)
  end

  defp copy_prefix_directory(source, dest) do
    File.mkdir_p!(dest)
    source_pglite = Path.join(source, "tmp/pglite")
    dest_pglite = Path.join(dest, "tmp/pglite")
    File.mkdir_p!(dest_pglite)

    if File.exists?(source_pglite) do
      source_pglite
      |> File.ls!()
      |> Enum.reject(&(&1 == "base"))
      |> Enum.each(fn entry ->
        src_path = Path.join(source_pglite, entry)
        dst_path = Path.join(dest_pglite, entry)
        File.cp_r!(src_path, dst_path)
      end)
    end
  end
end
