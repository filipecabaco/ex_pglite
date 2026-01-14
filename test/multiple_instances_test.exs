defmodule MultipleInstancesTest do
  use ExUnit.Case, async: true
  require Logger
  alias Pglite.Test.PortManager

  @moduletag :multiple_instances
  @moduletag :tmp_dir

  defp safe_stop(pid) do
    GenServer.stop(pid)
  catch
    :exit, _ -> :ok
  end

  describe "multiple PGlite instances with different ports" do
    test "can start and use three isolated instances on different ports", %{tmp_dir: tmp_dir} do
      [port1, port2, port3] = PortManager.checkout_multiple(3)
      on_exit(fn -> PortManager.checkin_multiple([port1, port2, port3]) end)

      {:ok, db1} =
        Pglite.start_link(
          tcp_port: port1,
          memory: true,
          data_dir: Path.join(tmp_dir, "db1"),
          startup_timeout: 30_000
        )

      {:ok, db2} =
        Pglite.start_link(
          tcp_port: port2,
          memory: true,
          data_dir: Path.join(tmp_dir, "db2"),
          startup_timeout: 30_000
        )

      {:ok, db3} =
        Pglite.start_link(
          tcp_port: port3,
          memory: true,
          data_dir: Path.join(tmp_dir, "db3"),
          startup_timeout: 30_000
        )

      on_exit(fn ->
        safe_stop(db1)
        safe_stop(db2)
        safe_stop(db3)
      end)

      opts1 = Pglite.get_connection_opts(db1)
      opts2 = Pglite.get_connection_opts(db2)
      opts3 = Pglite.get_connection_opts(db3)

      assert opts1[:port] == port1
      assert opts2[:port] == port2
      assert opts3[:port] == port3

      {:ok, conn1} = Postgrex.start_link(opts1)
      {:ok, conn2} = Postgrex.start_link(opts2)
      {:ok, conn3} = Postgrex.start_link(opts3)
      on_exit(fn ->
        safe_stop(conn1)
        safe_stop(conn2)
        safe_stop(conn3)
      end)

      {:ok, _} = Postgrex.query(conn1, "CREATE TABLE users (id INTEGER, name TEXT)", [])
      {:ok, _} = Postgrex.query(conn2, "CREATE TABLE users (id INTEGER, name TEXT)", [])
      {:ok, _} = Postgrex.query(conn3, "CREATE TABLE users (id INTEGER, name TEXT)", [])

      {:ok, _} = Postgrex.query(conn1, "INSERT INTO users VALUES (1, 'Alice')", [])
      {:ok, _} = Postgrex.query(conn2, "INSERT INTO users VALUES (2, 'Bob')", [])
      {:ok, _} = Postgrex.query(conn3, "INSERT INTO users VALUES (3, 'Charlie')", [])

      {:ok, %{rows: [[1, "Alice"]]}} = Postgrex.query(conn1, "SELECT * FROM users", [])
      {:ok, %{rows: [[2, "Bob"]]}} = Postgrex.query(conn2, "SELECT * FROM users", [])
      {:ok, %{rows: [[3, "Charlie"]]}} = Postgrex.query(conn3, "SELECT * FROM users", [])
    end

    test "instances are truly isolated - modifications don't affect each other", %{tmp_dir: tmp_dir} do
      [port1, port2] = PortManager.checkout_multiple(2)
      on_exit(fn -> PortManager.checkin_multiple([port1, port2]) end)

      {:ok, db1} =
        Pglite.start_link(
          tcp_port: port1,
          memory: true,
          data_dir: Path.join(tmp_dir, "db1"),
          startup_timeout: 30_000
        )

      {:ok, db2} =
        Pglite.start_link(
          tcp_port: port2,
          memory: true,
          data_dir: Path.join(tmp_dir, "db2"),
          startup_timeout: 30_000
        )

      on_exit(fn ->
        safe_stop(db1)
        safe_stop(db2)
      end)

      {:ok, conn1} = Postgrex.start_link(Pglite.get_connection_opts(db1))
      {:ok, conn2} = Postgrex.start_link(Pglite.get_connection_opts(db2))
      on_exit(fn ->
        safe_stop(conn1)
        safe_stop(conn2)
      end)

      {:ok, _} = Postgrex.query(conn1, "CREATE TABLE test_table (data TEXT)", [])
      {:ok, _} = Postgrex.query(conn1, "INSERT INTO test_table VALUES ('db1_data')", [])

      {:ok, %{rows: [["db1_data"]]}} = Postgrex.query(conn1, "SELECT * FROM test_table", [])

      {:error, %Postgrex.Error{postgres: %{code: :undefined_table}}} =
        Postgrex.query(conn2, "SELECT * FROM test_table", [])
    end
  end
end
