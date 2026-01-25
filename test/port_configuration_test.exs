defmodule PortConfigurationTest do
  use ExUnit.Case, async: true
  alias Pglite.Test.PortManager

  @moduletag timeout: 60_000
  @moduletag :tmp_dir

  setup context do
    port = PortManager.checkout()
    on_exit(fn -> PortManager.checkin(port) end)
    Map.put(context, :port, port)
  end

  defp safe_stop(pid) do
    GenServer.stop(pid)
  catch
    :exit, _ -> :ok
  end

  test "tcp_port parameter is correctly passed to Rust binary", %{tmp_dir: tmp_dir, port: port} do
    {:ok, pid} = Pglite.start_link(tcp_port: port, memory: true, data_dir: Path.join(tmp_dir, "db"), startup_timeout: 60_000)
    on_exit(fn -> safe_stop(pid) end)
    conn_opts = Pglite.get_connection_opts(pid)
    assert conn_opts[:port] == port
  end

  test "default port is 54321 when not specified", %{tmp_dir: tmp_dir} do
    {:ok, pid} = Pglite.start_link(memory: true, data_dir: Path.join(tmp_dir, "db"), startup_timeout: 60_000)
    on_exit(fn -> safe_stop(pid) end)
    conn_opts = Pglite.get_connection_opts(pid)
    assert conn_opts[:port] == 54_321
  end

  test "multiple instances can be configured with different ports", %{tmp_dir: tmp_dir, port: port1} do
    [port2, port3] = PortManager.checkout_multiple(2)
    on_exit(fn -> PortManager.checkin_multiple([port2, port3]) end)

    {:ok, pid1} = Pglite.start_link(tcp_port: port1, memory: true, data_dir: Path.join(tmp_dir, "db1"), startup_timeout: 60_000)
    {:ok, pid2} = Pglite.start_link(tcp_port: port2, memory: true, data_dir: Path.join(tmp_dir, "db2"), startup_timeout: 60_000)
    {:ok, pid3} = Pglite.start_link(tcp_port: port3, memory: true, data_dir: Path.join(tmp_dir, "db3"), startup_timeout: 60_000)
    on_exit(fn ->
      safe_stop(pid1)
      safe_stop(pid2)
      safe_stop(pid3)
    end)

    assert Pglite.get_connection_opts(pid1)[:port] == port1
    assert Pglite.get_connection_opts(pid2)[:port] == port2
    assert Pglite.get_connection_opts(pid3)[:port] == port3
  end
end
