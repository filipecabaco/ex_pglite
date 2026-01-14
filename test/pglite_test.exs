defmodule PgliteTest do
  use ExUnit.Case, async: true
  require Logger
  alias Pglite.Test.PortManager

  @moduletag :tmp_dir

  setup context do
    port = PortManager.checkout()
    on_exit(fn -> PortManager.checkin(port) end)
    Map.put(context, :port, port)
  end

  test "starts and stops cleanly", %{tmp_dir: tmp_dir, port: port} do
    assert {:ok, manager} = Pglite.start_link(data_dir: Path.join(tmp_dir, "db"), tcp_port: port)
    on_exit(fn -> stop_pglite(manager) end)
    assert Process.alive?(manager)

    assert :ok = GenServer.stop(manager)
    refute Process.alive?(manager)
  end

  test "supports named processes", %{tmp_dir: tmp_dir, port: port} do
    unique_name = String.to_atom("test_#{System.unique_integer([:positive])}")
    assert {:ok, manager} = Pglite.start_link(name: unique_name, data_dir: Path.join(tmp_dir, "db"), tcp_port: port)
    on_exit(fn -> stop_pglite(manager) end)

    assert Process.whereis(unique_name) == manager
  end

  test "supports persistent databases", %{tmp_dir: tmp_dir, port: port} do
    data_dir = Path.join(tmp_dir, "persistent_db")
    assert {:ok, manager} = Pglite.start_link(data_dir: data_dir, memory: false, tcp_port: port)
    on_exit(fn -> stop_pglite(manager) end)
    assert {:ok, _} = File.ls(data_dir)
  end

  defp stop_pglite(manager) do
    GenServer.stop(manager)
  catch
    :exit, _reason -> :ok
  end

  test "startup fails with very short timeout", %{port: port} do
    Process.flag(:trap_exit, true)
    result = Pglite.start_link(startup_timeout: 1, tcp_port: port)
    assert {:error, :startup_timeout} = result
  end

  test "get_connection_opts returns connection opts", %{tmp_dir: tmp_dir, port: port} do
    assert {:ok, manager} = Pglite.start_link(data_dir: Path.join(tmp_dir, "db"), tcp_port: port)
    on_exit(fn -> stop_pglite(manager) end)

    assert result = Pglite.get_connection_opts(manager)
    assert is_list(result)
    assert result[:hostname] == "127.0.0.1"
    assert result[:port] == port
    assert result[:database]
    assert result[:username]
    assert result[:password]
  end

  test "supports memory vs persistent mode", %{tmp_dir: tmp_dir, port: port} do
    port2 = PortManager.checkout()
    on_exit(fn -> PortManager.checkin(port2) end)

    assert {:ok, manager1} = Pglite.start_link(tcp_port: port)
    on_exit(fn -> stop_pglite(manager1) end)
    state1 = :sys.get_state(manager1)
    assert String.starts_with?(state1.data_dir, "memory://")

    data_dir = Path.join(tmp_dir, "persistent_db")
    assert {:ok, manager2} = Pglite.start_link(data_dir: data_dir, memory: false, tcp_port: port2)
    on_exit(fn -> stop_pglite(manager2) end)
    state2 = :sys.get_state(manager2)
    refute String.starts_with?(state2.data_dir, "memory://")
    assert state2.data_dir == data_dir
  end

  test "cleans up port without errors on shutdown", %{tmp_dir: tmp_dir, port: port} do
    {:ok, manager} = Pglite.start_link(tcp_port: port, data_dir: Path.join(tmp_dir, "db"))
    state = :sys.get_state(manager)
    os_port = state.port

    assert Port.info(os_port) != nil

    :ok = GenServer.stop(manager)

    Process.sleep(200)
    refute Process.alive?(manager)
  end
end
