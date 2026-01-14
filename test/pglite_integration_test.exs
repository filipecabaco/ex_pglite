defmodule PgliteIntegrationTest do
  use ExUnit.Case, async: true
  require Logger
  alias Pglite.Test.PortManager

  @moduletag :capture_log
  @moduletag :tmp_dir

  defp safe_stop(pid) do
    GenServer.stop(pid)
  catch
    :exit, _ -> :ok
  end

  test "executes simple queries", %{tmp_dir: tmp_dir} do
    port = PortManager.checkout()
    on_exit(fn -> PortManager.checkin(port) end)

    {:ok, conn} = start_postgrex(data_dir: Path.join(tmp_dir, "db"), tcp_port: port)

    assert {:ok, result} = Postgrex.query(conn, "SELECT 1 as test", [])
    assert %Postgrex.Result{} = result
    assert result.rows == [[1]]
    assert result.columns == ["test"]
  end

  test "executes queries with parameters", %{tmp_dir: tmp_dir} do
    port = PortManager.checkout()
    on_exit(fn -> PortManager.checkin(port) end)

    {:ok, conn} = start_postgrex(data_dir: Path.join(tmp_dir, "db"), tcp_port: port)

    assert {:ok, result} = Postgrex.query(conn, "SELECT $1::integer as value", [42])
    assert result.rows == [[42]]
  end

  test "executes DDL statements", %{tmp_dir: tmp_dir} do
    port = PortManager.checkout()
    on_exit(fn -> PortManager.checkin(port) end)

    {:ok, conn} = start_postgrex(data_dir: Path.join(tmp_dir, "db"), tcp_port: port)

    table_name = "test_ddl_#{:rand.uniform(10000)}"

    assert {:ok, _result} =
             Postgrex.query(conn, "CREATE TABLE #{table_name} (id INTEGER, name TEXT)", [])
  end

  test "executes DML statements with parameters", %{tmp_dir: tmp_dir} do
    port = PortManager.checkout()
    on_exit(fn -> PortManager.checkin(port) end)

    {:ok, conn} = start_postgrex(data_dir: Path.join(tmp_dir, "db"), tcp_port: port)

    table_name = "test_dml_#{:rand.uniform(10000)}"

    assert {:ok, _result} =
             Postgrex.query(conn, "CREATE TABLE #{table_name} (id INTEGER, name TEXT)", [])

    assert {:ok, _result} =
             Postgrex.query(conn, "INSERT INTO #{table_name} (id, name) VALUES ($1, $2)", [
               1,
               "Alice"
             ])

    assert {:ok, result} = Postgrex.query(conn, "SELECT * FROM #{table_name}", [])
    assert result.rows == [[1, "Alice"]]
  end

  test "executes transactions", %{tmp_dir: tmp_dir} do
    port = PortManager.checkout()
    on_exit(fn -> PortManager.checkin(port) end)

    {:ok, conn} = start_postgrex(data_dir: Path.join(tmp_dir, "db"), tcp_port: port)

    table_name = "test_txn_#{:rand.uniform(10000)}"

    assert {:ok, _result} =
             Postgrex.query(conn, "CREATE TABLE #{table_name} (id INTEGER, name TEXT)", [])

    result =
      Postgrex.transaction(conn, fn conn ->
        {:ok, _} =
          Postgrex.query(conn, "INSERT INTO #{table_name} (id, name) VALUES (1, 'Bob')", [])

        {:ok, result} = Postgrex.query(conn, "SELECT * FROM #{table_name}", [])
        result
      end)

    assert {:ok, %Postgrex.Result{rows: [[1, "Bob"]]}} = result
  end

  test "connect with custom username, password and database", %{tmp_dir: tmp_dir} do
    port = PortManager.checkout()
    on_exit(fn -> PortManager.checkin(port) end)

    {:ok, conn} =
      start_postgrex(
        username: "user1",
        password: "pass1",
        database: "db1",
        tcp_port: port,
        data_dir: Path.join(tmp_dir, "db")
      )

    assert {:ok, result} = Postgrex.query(conn, "SELECT 1 as test", [])
    assert %Postgrex.Result{} = result
    assert result.rows == [[1]]
  end

  test "can run multiple instances simultaneously with different data", %{tmp_dir: tmp_dir} do
    [port1, port2, port3] = PortManager.checkout_multiple(3)
    on_exit(fn -> PortManager.checkin_multiple([port1, port2, port3]) end)

    {:ok, conn1} = start_postgrex(data_dir: Path.join(tmp_dir, "db1"), tcp_port: port1)
    {:ok, conn2} = start_postgrex(data_dir: Path.join(tmp_dir, "db2"), tcp_port: port2)
    {:ok, conn3} = start_postgrex(data_dir: Path.join(tmp_dir, "db3"), tcp_port: port3)

    {:ok, _} = Postgrex.query(conn1, "CREATE TABLE users (id INTEGER, name TEXT)", [])

    {:ok, _} =
      Postgrex.query(conn2, "CREATE TABLE products (id INTEGER, title TEXT, price DECIMAL)", [])

    {:ok, _} =
      Postgrex.query(conn3, "CREATE TABLE orders (id INTEGER, user_id INTEGER, total DECIMAL)", [])

    {:ok, _} = Postgrex.query(conn1, "INSERT INTO users VALUES (1, 'Alice')", [])
    {:ok, _} = Postgrex.query(conn2, "INSERT INTO products VALUES (1, 'Widget', 9.99)", [])
    {:ok, _} = Postgrex.query(conn3, "INSERT INTO orders VALUES (1, 1, 9.99)", [])

    {:ok, result1} = Postgrex.query(conn1, "SELECT * FROM users", [])
    {:ok, result2} = Postgrex.query(conn2, "SELECT * FROM products", [])
    {:ok, result3} = Postgrex.query(conn3, "SELECT * FROM orders", [])

    assert result1.rows == [[1, "Alice"]]
    assert result2.rows == [[1, "Widget", Decimal.new("9.99")]]
    assert result3.rows == [[1, 1, Decimal.new("9.99")]]
  end

  test "concurrent operations on different instances don't interfere", %{tmp_dir: tmp_dir} do
    [port1, port2] = PortManager.checkout_multiple(2)
    on_exit(fn -> PortManager.checkin_multiple([port1, port2]) end)

    {:ok, conn1} = start_postgrex(data_dir: Path.join(tmp_dir, "db1"), tcp_port: port1)
    {:ok, conn2} = start_postgrex(data_dir: Path.join(tmp_dir, "db2"), tcp_port: port2)

    {:ok, _} = Postgrex.query(conn1, "CREATE TABLE counters (id INTEGER, value INTEGER)", [])
    {:ok, _} = Postgrex.query(conn2, "CREATE TABLE counters (id INTEGER, value INTEGER)", [])
    {:ok, _} = Postgrex.query(conn1, "INSERT INTO counters VALUES (1, 0)", [])
    {:ok, _} = Postgrex.query(conn2, "INSERT INTO counters VALUES (1, 0)", [])

    tasks =
      for i <- 1..10 do
        Task.async(fn ->
          conn = if rem(i, 2) == 0, do: conn1, else: conn2

          Postgrex.transaction(conn, fn conn ->
            {:ok, result} = Postgrex.query(conn, "SELECT value FROM counters WHERE id = 1", [])
            current_value = result.rows |> List.first() |> List.first()

            new_value = current_value + 1

            {:ok, _} =
              Postgrex.query(conn, "UPDATE counters SET value = $1 WHERE id = 1", [new_value])

            new_value
          end)
        end)
      end

    assert Enum.all?(Task.await_many(tasks, 5000), fn
             {:ok, _} -> true
             _ -> false
           end)
  end

  test "instances can be stopped and restarted independently", %{tmp_dir: tmp_dir} do
    [port1, port2] = PortManager.checkout_multiple(2)
    on_exit(fn -> PortManager.checkin_multiple([port1, port2]) end)

    {:ok, manager1} =
      Pglite.start_link(data_dir: Path.join(tmp_dir, "db1"), tcp_port: port1)

    {:ok, manager2} =
      Pglite.start_link(data_dir: Path.join(tmp_dir, "db2"), tcp_port: port2)

    on_exit(fn ->
      safe_stop(manager1)
      safe_stop(manager2)
    end)

    assert Process.alive?(manager1)
    assert Process.alive?(manager2)

    GenServer.stop(manager1)
    refute Process.alive?(manager1)

    assert Process.alive?(manager2)
    opts2 = Pglite.get_connection_opts(manager2)

    {:ok, conn2} =
      Postgrex.start_link(opts2 ++ [timeout: 120_000, connect_timeout: 120_000])

    on_exit(fn -> safe_stop(conn2) end)

    assert {:ok, _result} = Postgrex.query(conn2, "SELECT 1", [])
  end

  test "health_check validates connection to running instance", %{tmp_dir: tmp_dir} do
    port = PortManager.checkout()
    on_exit(fn -> PortManager.checkin(port) end)

    {:ok, manager} = Pglite.start_link(data_dir: Path.join(tmp_dir, "db"), tcp_port: port)
    on_exit(fn -> safe_stop(manager) end)

    assert :ok = Pglite.health_check(manager)
  end

  defp start_postgrex(opts, override_opts \\ []) do
    {:ok, manager} = Pglite.start_link(opts)

    on_exit(fn -> safe_stop(manager) end)

    opts = Pglite.get_connection_opts(manager)
    opts = Keyword.merge(opts, override_opts)
    opts = Keyword.put(opts, :parameters, application_name: "test_query")
    opts = Keyword.put(opts, :timeout, 120_000)
    opts = Keyword.put(opts, :connect_timeout, 120_000)
    opts = Keyword.put(opts, :queue_target, 20_000)
    opts = Keyword.put(opts, :queue_interval, 10_000)

    Postgrex.start_link(opts)
  end
end
