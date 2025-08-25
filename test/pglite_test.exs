defmodule PgliteTest do
  use ExUnit.Case
  require Logger

  @moduletag :capture_log

  test "starts and stops cleanly" do
    assert {:ok, manager} = Pglite.start_link(data_dir: "tmp/pglite_test_#{:rand.uniform(10000)}")
    on_exit(fn -> stop_pglite(manager) end)
    assert Process.alive?(manager)

    assert :ok = GenServer.stop(manager)
    refute Process.alive?(manager)
  end

  test "supports named processes" do
    unique_name = String.to_atom("test_#{System.unique_integer([:positive])}")
    assert {:ok, manager} = Pglite.start_link(name: unique_name)
    on_exit(fn -> stop_pglite(manager) end)

    assert Process.whereis(unique_name) == manager
  end

  test "supports persistent databases" do
    data_dir = "tmp/pglite_test_#{System.unique_integer([:positive])}"
    assert {:ok, manager} = Pglite.start_link(data_dir: data_dir, memory: false)
    on_exit(fn -> stop_pglite(manager) end)
    assert {:ok, _} = File.ls(data_dir)
  end

  defp stop_pglite(manager) do
    try do
      GenServer.stop(manager)
    catch
      :exit, _reason -> :ok
    end
  end

  test "handles startup timeout" do
    Process.flag(:trap_exit, true)
    assert {:error, :startup_timeout} = Pglite.start_link(startup_timeout: 1)
  end

  test "get_connection_opts returns connection opts" do
    assert {:ok, manager} = Pglite.start_link()
    on_exit(fn -> stop_pglite(manager) end)

    assert result = Pglite.get_connection_opts(manager)
    assert is_list(result)
    assert result[:socket_dir]
    assert result[:database]
    assert result[:username]
    assert result[:password]
  end

  test "supports initial_memory option" do
    # 32 MB
    initial_memory = 32 * 1024 * 1024
    assert {:ok, manager} = Pglite.start_link(initial_memory: initial_memory)
    on_exit(fn -> stop_pglite(manager) end)
    assert Process.alive?(manager)

    # Verify the option was set in the state
    assert %{initial_memory: ^initial_memory} = :sys.get_state(manager)

    assert :ok = GenServer.stop(manager)
    refute Process.alive?(manager)
  end
end
