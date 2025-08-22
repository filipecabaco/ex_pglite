defmodule Pglite.Runner.BunSocket do
  @moduledoc """
  Bun-based runner for PGLite that manages Bun processes and Unix socket communication.
  This module provides a Unix domain socket interface to communicate with Bun processes.
  """
  use GenServer
  require Logger

  defstruct [
    :socket,
    :data_dir,
    :request_id,
    :pending_requests,
    :socket_path,
    :bun_port,
    :timeout
  ]

  @type t :: %__MODULE__{
          socket: :socket.socket(),
          data_dir: String.t(),
          request_id: integer(),
          pending_requests: map(),
          socket_path: String.t(),
          bun_port: port(),
          timeout: integer()
        }
  def start_link(opts \\ []) do
    {gen_opts, init_opts} = Keyword.split(opts, [:name])
    GenServer.start_link(__MODULE__, init_opts, gen_opts)
  end

  def query(server, sql, params \\ []) do
    try do
      GenServer.call(server, {:query, sql, params})
    catch
      :exit, {:timeout, _} -> {:error, :timeout}
      :exit, {:noproc, _} -> {:error, :not_running}
    end
  end

  def exec(server, sql, params \\ []) do
    try do
      GenServer.call(server, {:exec, sql, params})
    catch
      :exit, {:timeout, _} -> {:error, :timeout}
      :exit, {:noproc, _} -> {:error, :not_running}
    end
  end

  def transaction(server, queries) do
    try do
      GenServer.call(server, {:transaction, queries})
    catch
      :exit, {:timeout, _} -> {:error, :timeout}
      :exit, {:noproc, _} -> {:error, :not_running}
    end
  end

  def health_check(server) do
    try do
      GenServer.call(server, :health_check)
    catch
      :exit, {:timeout, _} -> {:error, :timeout}
      :exit, {:noproc, _} -> {:error, :not_running}
    end
  end

  # Private helper functions
  defp generate_random_data_dir do
    timestamp = System.system_time(:millisecond)
    random_suffix = System.unique_integer([:positive])
    "memory://#{timestamp}_#{random_suffix}"
  end

  defp find_bun_executable do
    case System.find_executable("bun") do
      # Fallback to simple command if not found in PATH
      nil -> "bun"
      path -> path
    end
  end

  # GenServer callbacks
  def init(opts) do
    Process.flag(:trap_exit, true)
    data_dir = Keyword.get(opts, :data_dir, generate_random_data_dir())
    timeout = Keyword.get(opts, :timeout, 5000)

    case start_bun_process(data_dir, timeout) do
      {:ok, socket_path, bun_port} ->
        case connect_to_socket(socket_path) do
          {:ok, socket} ->
            state = %__MODULE__{
              socket: socket,
              data_dir: data_dir,
              request_id: 0,
              pending_requests: %{},
              socket_path: socket_path,
              bun_port: bun_port,
              timeout: timeout
            }

            Logger.info("Connected to Bun process via Unix socket: #{socket_path}")
            {:ok, state}

          {:error, reason} ->
            Logger.error("Failed to connect to socket: #{inspect(reason)}")
            # Clean up the Bun process
            safe_close_port(bun_port)
            {:stop, reason}
        end

      {:error, reason} ->
        Logger.error("Failed to start Bun process: #{inspect(reason)}")
        {:stop, reason}
    end
  end

  defp start_bun_process(data_dir, timeout) do
    # Allow test environment to override priv_dir for error testing
    priv_dir = Application.get_env(:pglite, :priv_dir, :code.priv_dir(:pglite))
    script_path = Path.join([priv_dir, "bun", "pglite_runner.js"])

    case File.exists?(script_path) do
      true ->
        # Generate unique socket path
        socket_dir = "/tmp/pglite_sockets"
        File.mkdir_p!(socket_dir)
        socket_path = Path.join(socket_dir, "pglite_#{System.unique_integer([:positive])}.sock")

        # Find bun executable in PATH and start Bun process in background with flags
        bun_executable = find_bun_executable()
        bun_command = "#{bun_executable} --smol --no-error-format #{script_path} #{socket_path} #{data_dir}"
        port = Port.open({:spawn, bun_command}, [:binary, :exit_status, {:line, 1024}])

        # Wait for the "ready" message from Bun process
        case wait_for_ready_signal(port, socket_path, timeout) do
          {:ok, socket_path} ->
            {:ok, socket_path, port}

          {:error, reason} ->
            safe_close_port(port)
            {:error, reason}
        end

      false ->
        {:error, :script_not_found}
    end
  end

  defp wait_for_ready_signal(port, socket_path, timeout) do
    receive do
      {^port, {:data, {:eol, line}}} ->
        case Jason.decode(line) do
          {:ok, %{"id" => "ready", "success" => true}} ->
            {:ok, socket_path}

          {:ok, _other} ->
            wait_for_ready_signal(port, socket_path, timeout)

          {:error, _} ->
            wait_for_ready_signal(port, socket_path, timeout)
        end

      {^port, {:exit_status, status}} ->
        Logger.error("Bun process exited with status #{status} during startup")
        {:error, {:bun_startup_failed, status}}
    after
      timeout ->
        Logger.error("Timeout waiting for Bun process to be ready")
        {:error, :startup_timeout}
    end
  end

  defp safe_close_port(port) when is_port(port) do
    try do
      Port.close(port)
    catch
      :error, :badarg ->
        Logger.debug("Port already closed")
        :ok
    end
  end

  defp safe_close_port(_), do: :ok

  defp connect_to_socket(socket_path) do
    # Try to connect with retries
    connect_with_retry(socket_path, 10, 50)
  end

  defp connect_with_retry(_socket_path, 0, _delay) do
    {:error, :connection_timeout}
  end

  defp connect_with_retry(socket_path, retries, delay) do
    case :socket.open(:local, :stream) do
      {:ok, socket} ->
        case :socket.connect(socket, %{family: :local, path: socket_path}) do
          :ok ->
            {:ok, socket}

          {:error, _reason} ->
            :socket.close(socket)
            Process.sleep(delay)
            connect_with_retry(socket_path, retries - 1, delay)
        end

      {:error, _reason} ->
        Process.sleep(delay)
        connect_with_retry(socket_path, retries - 1, delay)
    end
  end

  defp send_request(state, action, params) do
    request_id = state.request_id + 1
    request_id_str = "req_#{request_id}"

    request_data =
      Map.merge(params, %{
        id: request_id_str,
        action: action
      })

    json_data = Jason.encode!(request_data)
    Logger.debug("Sending request via socket: #{json_data}")

    case :socket.send(state.socket, json_data <> "\n") do
      :ok ->
        new_state = %{
          state
          | request_id: request_id,
            pending_requests: Map.put(state.pending_requests, request_id_str, self())
        }

        Logger.debug("Waiting for response with ID: #{request_id_str}")

        # Wait for response
        case :socket.recv(state.socket, 0, state.timeout) do
          {:ok, response_data} ->
            # Remove trailing newline
            response_data = String.trim(response_data)
            Logger.debug("Received response: #{response_data}")

            case Jason.decode(response_data) do
              {:ok, %{"id" => ^request_id_str, "success" => true, "result" => result}} ->
                Logger.debug("Request successful: #{inspect(result)}")

                final_state = %{
                  new_state
                  | pending_requests: Map.delete(new_state.pending_requests, request_id_str)
                }

                {:ok, result, final_state}

              {:ok, %{"id" => ^request_id_str, "success" => false, "error" => error}} ->
                Logger.debug("Request failed: #{inspect(error)}")

                final_state = %{
                  new_state
                  | pending_requests: Map.delete(new_state.pending_requests, request_id_str)
                }

                {:error, error, final_state}

              {:ok, response} ->
                Logger.warning("Unexpected response format: #{inspect(response)}")
                {:error, :unexpected_response_format, new_state}

              {:error, decode_error} ->
                Logger.error("Failed to decode response: #{inspect(decode_error)}")
                {:error, :decode_error, new_state}
            end

          {:error, reason} ->
            Logger.error("Socket recv error: #{inspect(reason)}")
            {:error, reason, new_state}
        end

      {:error, reason} ->
        Logger.error("Socket send error: #{inspect(reason)}")
        {:error, reason, state}
    end
  end

  # GenServer callbacks
  def handle_call({:query, sql, params}, _from, state) do
    case send_request(state, "query", %{sql: sql, params: params}) do
      {:ok, result, new_state} -> {:reply, {:ok, result}, new_state}
      {:error, reason, new_state} -> {:reply, {:error, reason}, new_state}
    end
  end

  def handle_call({:exec, sql, params}, _from, state) do
    case send_request(state, "exec", %{sql: sql, params: params}) do
      {:ok, result, new_state} -> {:reply, {:ok, result}, new_state}
      {:error, reason, new_state} -> {:reply, {:error, reason}, new_state}
    end
  end

  def handle_call({:transaction, queries}, _from, state) do
    case send_request(state, "transaction", %{queries: queries}) do
      {:ok, result, new_state} -> {:reply, {:ok, result}, new_state}
      {:error, reason, new_state} -> {:reply, {:error, reason}, new_state}
    end
  end

  def handle_call(:health_check, _from, state) do
    case send_request(state, "query", %{sql: "SELECT 1", params: []}) do
      {:ok, _result, new_state} -> {:reply, {:ok, :healthy}, new_state}
      {:error, reason, new_state} -> {:reply, {:error, reason}, new_state}
    end
  end

  def handle_call(_unknown_call, _from, state) do
    {:reply, {:error, :unknown_call}, state}
  end

  def handle_info({port, {:exit_status, status}}, %{bun_port: port} = state) do
    Logger.error("Bun process exited with status: #{status}")
    {:stop, {:bun_exit, status}, state}
  end

  def handle_info(_msg, state) do
    {:noreply, state}
  end

  def terminate(reason, state) do
    Logger.info("Terminating Bun socket connection: #{inspect(reason)}")

    # Send close request to Bun process if socket is available
    if state.socket do
      try do
        send_close_request(state)
      catch
        _, _ -> :ok
      end
    end

    # Close socket safely
    if state.socket do
      try do
        :socket.close(state.socket)
      catch
        _, _ -> :ok
      end
    end

    # Close Bun process safely
    safe_close_port(state.bun_port)

    # Clean up socket file
    if state.socket_path do
      File.rm(state.socket_path)
    end

    :ok
  end

  defp send_close_request(state) do
    request_data = %{
      id: "close_#{System.unique_integer([:positive])}",
      action: "close"
    }

    json_data = Jason.encode!(request_data)
    :socket.send(state.socket, json_data <> "\n")

    # Wait for graceful shutdown with timeout
    wait_for_process_exit(state.bun_port, 1000)
  end

  defp wait_for_process_exit(port, timeout) when is_port(port) do
    receive do
      {^port, {:exit_status, _status}} ->
        Logger.debug("Bun process exited gracefully")
        :ok
    after
      timeout ->
        Logger.warning("Bun process didn't exit gracefully within #{timeout}ms, force closing")
        :timeout
    end
  end

  defp wait_for_process_exit(_, _), do: :ok
end
