defmodule PgliteIntegrationTest do
  use ExUnit.Case
  require Logger

  @moduletag :capture_log

  setup do
    File.rm_rf("tmp")
    File.mkdir_p!("tmp")

    temp_dir = Path.join("tmp", "pglite_integration_test_#{System.unique_integer([:positive])}")
    %{temp_dir: temp_dir}
  end

  test "executes simple queries", %{temp_dir: temp_dir} do
    {:ok, conn} = start_postgrex(data_dir: temp_dir)

    assert {:ok, result} = Postgrex.query(conn, "SELECT 1 as test", [])
    assert %Postgrex.Result{} = result
    assert result.rows == [[1]]
    assert result.columns == ["test"]
  end

  test "executes queries with parameters", %{temp_dir: temp_dir} do
    {:ok, conn} = start_postgrex(data_dir: temp_dir)

    assert {:ok, _result} = Postgrex.query(conn, "SELECT $1::integer as value", [42])
  end

  test "executes DDL statements", %{temp_dir: temp_dir} do
    {:ok, conn} = start_postgrex(data_dir: temp_dir)

    table_name = "test_ddl_#{:rand.uniform(10000)}"

    assert {:ok, _result} =
             Postgrex.query(conn, "CREATE TABLE #{table_name} (id INTEGER, name TEXT)", [])
  end

  test "executes DML statements with parameters", %{temp_dir: temp_dir} do
    {:ok, conn} = start_postgrex(data_dir: temp_dir)

    table_name = "test_dml_#{:rand.uniform(10000)}"

    assert {:ok, _result} =
             Postgrex.query(conn, "CREATE TABLE #{table_name} (id INTEGER, name TEXT)", [])

    assert {:ok, _result} =
             Postgrex.query(conn, "INSERT INTO #{table_name} (id, name) VALUES ($1, $2)", [1, "Alice"])

    assert {:ok, result} = Postgrex.query(conn, "SELECT * FROM #{table_name}", [])
    assert result.rows == [[1, "Alice"]]
  end

  test "executes transactions", %{temp_dir: temp_dir} do
    {:ok, conn} = start_postgrex(data_dir: temp_dir)

    table_name = "test_txn_#{:rand.uniform(10000)}"

    assert {:ok, _result} =
             Postgrex.query(conn, "CREATE TABLE #{table_name} (id INTEGER, name TEXT)", [])

    result =
      Postgrex.transaction(conn, fn conn ->
        {:ok, _} = Postgrex.query(conn, "INSERT INTO #{table_name} (id, name) VALUES (1, 'Bob')", [])
        {:ok, result} = Postgrex.query(conn, "SELECT * FROM #{table_name}", [])
        result
      end)

    assert {:ok, %Postgrex.Result{rows: [[1, "Bob"]]}} = result
  end

  test "handles database errors gracefully", %{temp_dir: temp_dir} do
    Process.flag(:trap_exit, true)
    {:ok, conn} = start_postgrex(data_dir: temp_dir)

    # Try to query a non-existent table
    assert {:error, _reason} = Postgrex.query(conn, "SELECT * FROM non_existent_table", [])
    refute_receive {:EXIT, _manager, {:ex_pglite_exit, _status}}
  end

  test "handles invalid SQL gracefully", %{temp_dir: temp_dir} do
    Process.flag(:trap_exit, true)
    {:ok, conn} = start_postgrex(data_dir: temp_dir)

    assert {:error, _reason} = Postgrex.query(conn, "INVALID SQL SYNTAX", [])
    refute_receive {:EXIT, _manager, {:ex_pglite_exit, _status}}
  end

  test "handles connection failures", %{temp_dir: temp_dir} do
    Process.flag(:trap_exit, true)

    {:ok, conn} = start_postgrex(data_dir: temp_dir)

    assert {:ok, _result} = Postgrex.query(conn, "SELECT 1", [])
    refute_receive {:EXIT, ^conn, {:ex_pglite_exit, _status}}

    GenServer.stop(conn)
    Process.sleep(50)

    error =
      try do
        Postgrex.query(conn, "SELECT 1", [])
      catch
        :exit, _reason -> :error
      end

    assert :error = error
  end

  test "can run multiple instances simultaneously with different data" do
    {:ok, conn1} = start_postgrex(data_dir: "tmp/pglite_integration_multi_1")
    {:ok, conn2} = start_postgrex(data_dir: "tmp/pglite_integration_multi_2")
    {:ok, conn3} = start_postgrex(data_dir: "tmp/pglite_integration_multi_3")

    # Create different tables in each instance
    {:ok, _} = Postgrex.query(conn1, "CREATE TABLE users (id INTEGER, name TEXT)", [])
    {:ok, _} = Postgrex.query(conn2, "CREATE TABLE products (id INTEGER, title TEXT, price DECIMAL)", [])
    {:ok, _} = Postgrex.query(conn3, "CREATE TABLE orders (id INTEGER, user_id INTEGER, total DECIMAL)", [])

    # Insert different data
    {:ok, _} = Postgrex.query(conn1, "INSERT INTO users VALUES (1, 'Alice')", [])
    {:ok, _} = Postgrex.query(conn2, "INSERT INTO products VALUES (1, 'Widget', 9.99)", [])
    {:ok, _} = Postgrex.query(conn3, "INSERT INTO orders VALUES (1, 1, 9.99)", [])

    # Verify each instance has its own data
    {:ok, result1} = Postgrex.query(conn1, "SELECT * FROM users", [])
    {:ok, result2} = Postgrex.query(conn2, "SELECT * FROM products", [])
    {:ok, result3} = Postgrex.query(conn3, "SELECT * FROM orders", [])

    assert result1.rows == [[1, "Alice"]]
    assert result2.rows == [[1, "Widget", Decimal.new("9.99")]]
    assert result3.rows == [[1, 1, Decimal.new("9.99")]]
  end

  test "concurrent operations on different instances don't interfere" do
    # Create two instances
    {:ok, conn1} = start_postgrex(data_dir: "tmp/pglite_integration_concurrent_1")
    {:ok, conn2} = start_postgrex(data_dir: "tmp/pglite_integration_concurrent_2")

    # Set up tables
    {:ok, _} = Postgrex.query(conn1, "CREATE TABLE counters (id INTEGER, value INTEGER)", [])
    {:ok, _} = Postgrex.query(conn2, "CREATE TABLE counters (id INTEGER, value INTEGER)", [])
    {:ok, _} = Postgrex.query(conn1, "INSERT INTO counters VALUES (1, 0)", [])
    {:ok, _} = Postgrex.query(conn2, "INSERT INTO counters VALUES (1, 0)", [])

    # Run concurrent operations
    tasks =
      for i <- 1..10 do
        Task.async(fn ->
          conn = if rem(i, 2) == 0, do: conn1, else: conn2

          Postgrex.transaction(conn, fn conn ->
            # Get current value
            {:ok, result} = Postgrex.query(conn, "SELECT value FROM counters WHERE id = 1", [])
            current_value = result.rows |> List.first() |> List.first()

            # Increment
            new_value = current_value + 1
            {:ok, _} = Postgrex.query(conn, "UPDATE counters SET value = $1 WHERE id = 1", [new_value])
            new_value
          end)
        end)
      end

    assert Enum.all?(Task.await_many(tasks, 5000), fn
             {:ok, _} -> true
             _ -> false
           end)
  end

  test "connect with custom username, password and database" do
    {:ok, conn} = start_postgrex(username: "user1", password: "pass1", database: "db1")

    assert {:ok, result} = Postgrex.query(conn, "SELECT 1 as test", [])
    assert %Postgrex.Result{} = result
    assert result.rows == [[1]]
  end

  defp start_postgrex(opts, override_opts \\ []) do
    {:ok, manager} = Pglite.start_link(opts)

    on_exit(fn ->
      try do
        Process.unlink(manager)
        GenServer.stop(manager)
      catch
        :exit, _reason -> :ok
      end
    end)

    opts = Pglite.get_connection_opts(manager)
    opts = Keyword.delete(opts, :socket)
    opts = Keyword.merge(opts, override_opts)
    opts = Keyword.put(opts, :parameters, application_name: "test_query")

    Postgrex.start_link(opts)
  end
end
