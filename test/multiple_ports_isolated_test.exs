defmodule MultiplePortsIsolatedTest do
  use ExUnit.Case, async: true
  alias Pglite.Test.PortManager

  @moduletag timeout: 120_000
  @moduletag :tmp_dir

  defp safe_stop(pid) do
    GenServer.stop(pid)
  catch
    :exit, _ -> :ok
  end

  test "can run multiple isolated PGlite instances on different TCP ports", %{tmp_dir: tmp_dir} do
    [port1, port2, port3] = PortManager.checkout_multiple(3)
    on_exit(fn -> PortManager.checkin_multiple([port1, port2, port3]) end)

    {:ok, pid1} = Pglite.start_link(tcp_port: port1, memory: true, data_dir: Path.join(tmp_dir, "db1"))
    {:ok, pid2} = Pglite.start_link(tcp_port: port2, memory: true, data_dir: Path.join(tmp_dir, "db2"))
    {:ok, pid3} = Pglite.start_link(tcp_port: port3, memory: true, data_dir: Path.join(tmp_dir, "db3"))


    on_exit(fn ->
      safe_stop(pid1)
      safe_stop(pid2)
      safe_stop(pid3)
    end)

    conn_opts1 = Pglite.get_connection_opts(pid1)
    conn_opts2 = Pglite.get_connection_opts(pid2)
    conn_opts3 = Pglite.get_connection_opts(pid3)

    assert conn_opts1[:port] == port1
    assert conn_opts2[:port] == port2
    assert conn_opts3[:port] == port3


    {:ok, conn1} = Postgrex.start_link(conn_opts1)
    {:ok, conn2} = Postgrex.start_link(conn_opts2)
    {:ok, conn3} = Postgrex.start_link(conn_opts3)
    on_exit(fn ->
      safe_stop(conn1)
      safe_stop(conn2)
      safe_stop(conn3)
    end)


    {:ok, _} = Postgrex.query(conn1, "CREATE TABLE users (id int, name text)", [])
    {:ok, _} = Postgrex.query(conn2, "CREATE TABLE products (id int, price decimal)", [])
    {:ok, _} = Postgrex.query(conn3, "CREATE TABLE orders (id int, total decimal)", [])


    {:ok, _} = Postgrex.query(conn1, "INSERT INTO users VALUES (1, 'Alice')", [])
    {:ok, _} = Postgrex.query(conn2, "INSERT INTO products VALUES (1, 99.99)", [])
    {:ok, _} = Postgrex.query(conn3, "INSERT INTO orders VALUES (1, 149.99)", [])


    {:ok, result1} = Postgrex.query(conn1, "SELECT * FROM users", [])
    assert [[1, "Alice"]] = result1.rows

    {:ok, result2} = Postgrex.query(conn2, "SELECT * FROM products", [])
    assert [[1, price]] = result2.rows
    assert Decimal.equal?(price, Decimal.new("99.99"))

    {:ok, result3} = Postgrex.query(conn3, "SELECT * FROM orders", [])
    assert [[1, total]] = result3.rows
    assert Decimal.equal?(total, Decimal.new("149.99"))


    {:error, _} = Postgrex.query(conn1, "SELECT * FROM products", [])
    {:error, _} = Postgrex.query(conn2, "SELECT * FROM orders", [])
    {:error, _} = Postgrex.query(conn3, "SELECT * FROM users", [])


  end

  test "different instances can use same table names without conflict", %{tmp_dir: tmp_dir} do
    [port1, port2] = PortManager.checkout_multiple(2)
    on_exit(fn -> PortManager.checkin_multiple([port1, port2]) end)

    {:ok, pid1} = Pglite.start_link(tcp_port: port1, memory: true, data_dir: Path.join(tmp_dir, "db1"))
    {:ok, pid2} = Pglite.start_link(tcp_port: port2, memory: true, data_dir: Path.join(tmp_dir, "db2"))
    on_exit(fn ->
      safe_stop(pid1)
      safe_stop(pid2)
    end)

    conn_opts1 = Pglite.get_connection_opts(pid1)
    conn_opts2 = Pglite.get_connection_opts(pid2)

    {:ok, conn1} = Postgrex.start_link(conn_opts1)
    {:ok, conn2} = Postgrex.start_link(conn_opts2)
    on_exit(fn ->
      safe_stop(conn1)
      safe_stop(conn2)
    end)

    {:ok, _} = Postgrex.query(conn1, "CREATE TABLE test (id int, value text)", [])
    {:ok, _} = Postgrex.query(conn2, "CREATE TABLE test (id int, value text)", [])


    {:ok, _} = Postgrex.query(conn1, "INSERT INTO test VALUES (1, 'database1')", [])
    {:ok, _} = Postgrex.query(conn2, "INSERT INTO test VALUES (2, 'database2')", [])

    {:ok, result1} = Postgrex.query(conn1, "SELECT * FROM test", [])
    assert [[1, "database1"]] = result1.rows

    {:ok, result2} = Postgrex.query(conn2, "SELECT * FROM test", [])
    assert [[2, "database2"]] = result2.rows


  end
end
