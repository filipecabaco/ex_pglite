defmodule PgliteTest do
  use ExUnit.Case, async: true
  require Logger

  @moduletag :capture_log
  setup do
    # We cant use System.tmp_dir!() has the systems starts to remove the directories and make them fail
    temp_dir = Path.join("tmp", "pglite_test_#{:rand.uniform(10000)}")
    File.mkdir_p!(temp_dir)
    %{temp_dir: temp_dir}
  end

  describe "high-level API" do
    test "starts and stops cleanly", %{temp_dir: temp_dir} do
      assert {:ok, pid} = Pglite.start_link(data_dir: temp_dir)
      assert Process.alive?(pid)

      assert :ok = Pglite.stop(pid)
      refute Process.alive?(pid)
    end

    test "executes simple queries", %{temp_dir: temp_dir} do
      {:ok, pid} = Pglite.start_link(data_dir: temp_dir)

      assert {:ok, result} = Pglite.query(pid, "SELECT 1 as test")
      assert is_map(result)

      try do
        Pglite.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end

    test "executes queries with parameters", %{temp_dir: temp_dir} do
      {:ok, pid} = Pglite.start_link(data_dir: temp_dir)

      assert {:ok, _result} = Pglite.query(pid, "SELECT $1 as value", [42])

      try do
        Pglite.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end

    test "executes DDL statements", %{temp_dir: temp_dir} do
      {:ok, pid} = Pglite.start_link(data_dir: temp_dir)

      table_name = "test_ddl_#{:rand.uniform(10000)}"

      assert {:ok, _result} =
               Pglite.exec(pid, "CREATE TABLE #{table_name} (id INTEGER, name TEXT)")

      try do
        Pglite.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end

    test "executes DML statements with parameters", %{temp_dir: temp_dir} do
      {:ok, pid} = Pglite.start_link(data_dir: temp_dir)

      # Create table with unique name
      table_name = "users_dml_#{:rand.uniform(10000)}"

      assert {:ok, _result} =
               Pglite.exec(pid, "CREATE TABLE #{table_name} (id INTEGER, name TEXT)")

      # Insert data
      assert {:ok, _result} =
               Pglite.exec(pid, "INSERT INTO #{table_name} (id, name) VALUES ($1, $2)", [
                 1,
                 "Alice"
               ])

      # Query data
      assert {:ok, result} = Pglite.query(pid, "SELECT * FROM #{table_name} WHERE id = $1", [1])
      assert is_map(result)

      try do
        Pglite.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end

    test "executes transactions", %{temp_dir: temp_dir} do
      {:ok, pid} = Pglite.start_link(data_dir: temp_dir)

      # Create table with unique name
      table_name = "users_tx_#{:rand.uniform(10000)}"

      assert {:ok, _result} =
               Pglite.exec(pid, "CREATE TABLE #{table_name} (id INTEGER, name TEXT)")

      # Execute transaction
      queries = [
        %{sql: "INSERT INTO #{table_name} (id, name) VALUES ($1, $2)", params: [1, "Alice"]},
        %{sql: "INSERT INTO #{table_name} (id, name) VALUES ($1, $2)", params: [2, "Bob"]},
        %{sql: "UPDATE #{table_name} SET name = $1 WHERE id = $2", params: ["Alice Updated", 1]}
      ]

      assert {:ok, results} = Pglite.transaction(pid, queries)
      assert is_list(results)
      assert length(results) == 3

      try do
        Pglite.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end

    test "health check works", %{temp_dir: temp_dir} do
      {:ok, pid} = Pglite.start_link(data_dir: temp_dir)

      assert {:ok, :healthy} = Pglite.health_check(pid)

      try do
        Pglite.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end

    test "handles database errors gracefully", %{temp_dir: temp_dir} do
      {:ok, pid} = Pglite.start_link(data_dir: temp_dir)

      # Try to query a non-existent table
      assert {:error, _reason} = Pglite.query(pid, "SELECT * FROM non_existent_table")

      try do
        Pglite.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end

    test "supports named processes", %{temp_dir: temp_dir} do
      assert {:ok, pid} = Pglite.start_link(name: TestDatabase, data_dir: temp_dir)
      assert Process.alive?(pid)

      assert {:ok, :healthy} = Pglite.health_check(TestDatabase)

      Pglite.stop(TestDatabase)
    end

    test "supports persistent databases", %{temp_dir: temp_dir} do
      # Start with persistent storage
      assert {:ok, pid} = Pglite.start_link(data_dir: temp_dir)

      # Create table and insert data
      assert {:ok, _result} =
               Pglite.exec(pid, "CREATE TABLE persistent_test (id INTEGER, value TEXT)")

      assert {:ok, _result} = Pglite.exec(pid, "INSERT INTO persistent_test VALUES (1, 'test')")

      try do
        Pglite.stop(pid)
      catch
        :exit, _ -> :ok
      end

      # Clean up temp directory if it was created
      if File.exists?(temp_dir) do
        File.rm_rf!(temp_dir)
      end
    end
  end

  describe "error handling" do
    test "handles invalid SQL gracefully", %{temp_dir: temp_dir} do
      {:ok, pid} = Pglite.start_link(data_dir: temp_dir)

      assert {:error, _reason} = Pglite.query(pid, "INVALID SQL SYNTAX")

      try do
        Pglite.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end

    test "handles connection failures", %{temp_dir: temp_dir} do
      # Trap exits to prevent test process from being killed
      Process.flag(:trap_exit, true)
      
      {:ok, pid} = Pglite.start_link(data_dir: temp_dir)

      # Monitor the process before killing it
      ref = Process.monitor(pid)
      
      # Kill the process to simulate failure
      Process.exit(pid, :kill)
      
      # Wait for the process to die
      receive do
        {:DOWN, ^ref, :process, ^pid, _reason} -> :ok
      after
        1000 -> flunk("Process did not die within timeout")
      end

      # Operations should fail gracefully
      assert {:error, :not_running} = Pglite.query(pid, "SELECT 1")
    end
  end

  describe "concurrent instances" do
    test "can run multiple instances simultaneously with different data" do
      # Create multiple instances with different data directories
      {:ok, pid1} = Pglite.start_link(data_dir: "tmp/pglite_test_multi_1")
      {:ok, pid2} = Pglite.start_link(data_dir: "tmp/pglite_test_multi_2")
      {:ok, pid3} = Pglite.start_link(data_dir: "tmp/pglite_test_multi_3")

      # Create different tables in each instance
      {:ok, _} = Pglite.exec(pid1, "CREATE TABLE users (id INTEGER, name TEXT)")
      {:ok, _} = Pglite.exec(pid2, "CREATE TABLE products (id INTEGER, title TEXT, price DECIMAL)")
      {:ok, _} = Pglite.exec(pid3, "CREATE TABLE orders (id INTEGER, user_id INTEGER, total DECIMAL)")

      # Insert different data in each instance
      {:ok, _} = Pglite.exec(pid1, "INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob')")
      {:ok, _} = Pglite.exec(pid2, "INSERT INTO products VALUES (1, 'Laptop', 999.99), (2, 'Mouse', 29.99)")
      {:ok, _} = Pglite.exec(pid3, "INSERT INTO orders VALUES (1, 1, 999.99), (2, 2, 29.99)")

      # Query each instance simultaneously and verify different results
      task1 = Task.async(fn -> Pglite.query(pid1, "SELECT COUNT(*) as user_count FROM users") end)
      task2 = Task.async(fn -> Pglite.query(pid2, "SELECT COUNT(*) as product_count FROM products") end)
      task3 = Task.async(fn -> Pglite.query(pid3, "SELECT COUNT(*) as order_count FROM orders") end)

      # Wait for all queries to complete
      {:ok, result1} = Task.await(task1)
      {:ok, result2} = Task.await(task2)
      {:ok, result3} = Task.await(task3)

      # Verify each instance has its own data
      assert %{"rows" => [%{"user_count" => 2}]} = result1
      assert %{"rows" => [%{"product_count" => 2}]} = result2
      assert %{"rows" => [%{"order_count" => 2}]} = result3

      # Verify instances are independent - insert in one doesn't affect others
      {:ok, _} = Pglite.exec(pid1, "INSERT INTO users VALUES (3, 'Charlie')")
      
      {:ok, result1_updated} = Pglite.query(pid1, "SELECT COUNT(*) as user_count FROM users")
      {:ok, result2_unchanged} = Pglite.query(pid2, "SELECT COUNT(*) as product_count FROM products")
      {:ok, result3_unchanged} = Pglite.query(pid3, "SELECT COUNT(*) as order_count FROM orders")

      # Only pid1 should show the new data
      assert %{"rows" => [%{"user_count" => 3}]} = result1_updated
      assert %{"rows" => [%{"product_count" => 2}]} = result2_unchanged
      assert %{"rows" => [%{"order_count" => 2}]} = result3_unchanged

      # Clean up
      Pglite.stop(pid1)
      Pglite.stop(pid2)
      Pglite.stop(pid3)
    end

    test "concurrent operations on different instances don't interfere" do
      # Create two instances
      {:ok, pid1} = Pglite.start_link(data_dir: "tmp/pglite_test_concurrent_1")
      {:ok, pid2} = Pglite.start_link(data_dir: "tmp/pglite_test_concurrent_2")

      # Set up tables
      {:ok, _} = Pglite.exec(pid1, "CREATE TABLE counters (id INTEGER, value INTEGER)")
      {:ok, _} = Pglite.exec(pid2, "CREATE TABLE counters (id INTEGER, value INTEGER)")
      {:ok, _} = Pglite.exec(pid1, "INSERT INTO counters VALUES (1, 0)")
      {:ok, _} = Pglite.exec(pid2, "INSERT INTO counters VALUES (1, 0)")

      # Run concurrent increments on both instances
      tasks = for i <- 1..10 do
        Task.async(fn ->
          # Alternate between instances
          pid = if rem(i, 2) == 0, do: pid1, else: pid2
          
          # Get current value
          {:ok, result} = Pglite.query(pid, "SELECT value FROM counters WHERE id = 1")
          current_value = result["rows"] |> List.first() |> Map.get("value")
          
          # Increment
          {:ok, _} = Pglite.exec(pid, "UPDATE counters SET value = $1 WHERE id = 1", [current_value + 1])
          
          {pid, current_value + 1}
        end)
      end

      # Wait for all tasks
      _results = Enum.map(tasks, &Task.await/1)

      # Verify final values
      {:ok, final1} = Pglite.query(pid1, "SELECT value FROM counters WHERE id = 1")
      {:ok, final2} = Pglite.query(pid2, "SELECT value FROM counters WHERE id = 1")

      final_value1 = final1["rows"] |> List.first() |> Map.get("value")
      final_value2 = final2["rows"] |> List.first() |> Map.get("value")

      # Both instances should have been incremented independently
      # Due to race conditions, we can't guarantee exact totals, but we can verify:
      # 1. Both instances were modified
      # 2. The total increments happened (some may have been lost due to races)
      assert final_value1 > 0
      assert final_value2 > 0
      # Total should be between 2 and 10 (some increments may be lost to race conditions)
      total_increments = final_value1 + final_value2
      assert total_increments >= 2 and total_increments <= 10

      # Clean up
      Pglite.stop(pid1)
      Pglite.stop(pid2)
    end
  end
end
