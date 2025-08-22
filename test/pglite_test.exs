defmodule PgliteTest do
  use ExUnit.Case
  require Logger

  @moduletag :capture_log

  test "starts and stops cleanly" do
    assert {:ok, {manager, conn}} = Pglite.start_link(data_dir: "tmp/pglite_test_#{:rand.uniform(10000)}")
    on_exit(fn -> stop_pglite(manager) end)
    assert Process.alive?(manager)
    assert Process.alive?(conn)

    assert :ok = GenServer.stop(manager)
    refute Process.alive?(manager)
    refute Process.alive?(conn)
  end

  test "supports named processes" do
    unique_name = String.to_atom("test_#{System.unique_integer([:positive])}")
    assert {:ok, {manager, _conn}} = Pglite.start_link(name: unique_name)
    on_exit(fn -> stop_pglite(manager) end)

    assert Process.whereis(unique_name) == manager
  end

  test "supports persistent databases" do
    data_dir = "tmp/pglite_test_#{System.unique_integer([:positive])}"
    assert {:ok, {manager, _conn}} = Pglite.start_link(data_dir: data_dir, memory: false)
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
    assert {:error, :startup_timeout} = Pglite.start_link(timeout: 1)
  end

  test "terminate with postgrex connection cleanup error" do
    Process.flag(:trap_exit, true)
    {:ok, {manager, conn}} = Pglite.start_link()
    Process.exit(conn, :kill)
    Process.sleep(100)
    refute Process.alive?(manager)
    refute Process.alive?(conn)
  end
end
