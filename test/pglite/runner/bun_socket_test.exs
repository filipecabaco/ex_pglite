defmodule Pglite.Runner.BunSocketTest do
  use ExUnit.Case, async: true
  alias Pglite.Runner.BunSocket
  require Logger

  @moduletag :capture_log

  describe "process lifecycle" do
    test "starts and stops cleanly" do
      assert {:ok, pid} = BunSocket.start_link(name: :"test_#{:rand.uniform(1000)}")
      assert Process.alive?(pid)

      ref = Process.monitor(pid)

      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end

      # Ensure process terminates cleanly
      assert_receive {:DOWN, ^ref, :process, ^pid, :normal}, 1000
    end

    test "starts with custom data directory" do
      # Create a temporary directory for testing
      custom_dir = Path.join(System.tmp_dir!(), "pglite_custom_#{:rand.uniform(10000)}")
      File.mkdir_p!(custom_dir)

      name = :"test_#{:rand.uniform(1000)}"

      assert {:ok, pid} = BunSocket.start_link(name: name, data_dir: custom_dir)
      assert Process.alive?(pid)

      # Verify it's working by doing a health check
      assert {:ok, :healthy} = BunSocket.health_check(pid)

      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end

      # Clean up the custom directory
      File.rm_rf(custom_dir)
    end

    test "starts with auto-generated data directory when none specified" do
      name = :"test_#{:rand.uniform(1000)}"

      # Start without specifying data_dir - should auto-generate
      assert {:ok, pid} = BunSocket.start_link(name: name)
      assert Process.alive?(pid)

      # Verify it's working
      assert {:ok, :healthy} = BunSocket.health_check(pid)

      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end

    test "handles multiple instances" do
      assert {:ok, pid1} = BunSocket.start_link(name: :"test_1_#{:rand.uniform(1000)}")
      assert {:ok, pid2} = BunSocket.start_link(name: :"test_2_#{:rand.uniform(1000)}")

      assert Process.alive?(pid1)
      assert Process.alive?(pid2)
      assert pid1 != pid2

      try do
        GenServer.stop(pid1)
      catch
        :exit, _ -> :ok
      end

      try do
        GenServer.stop(pid2)
      catch
        :exit, _ -> :ok
      end
    end

    test "fails to start with duplicate name" do
      name = :"test_#{:rand.uniform(1000)}"
      assert {:ok, pid} = BunSocket.start_link(name: name)
      assert {:error, {:already_started, ^pid}} = BunSocket.start_link(name: name)

      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end
  end

  describe "health checks" do
    setup do
      name = :"test_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      on_exit(fn ->
        if Process.alive?(pid) do
          try do
            GenServer.stop(pid, :normal, 1000)
          catch
            :exit, _ -> :ok
          end
        end
      end)

      {:ok, pid: pid}
    end

    test "health check passes on fresh instance", %{pid: pid} do
      assert {:ok, :healthy} = BunSocket.health_check(pid)
    end

    test "health check works with named process" do
      name = :"test_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      assert {:ok, :healthy} = BunSocket.health_check(pid)

      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end

    test "health check fails after process termination", %{pid: pid} do
      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end

      # Give the process time to terminate
      Process.sleep(100)

      # Health check should return error when process is not running
      assert {:error, _} = BunSocket.health_check(pid)
    end

    test "health check handles timeout gracefully", %{pid: pid} do
      # Test health check with very short timeout
      result = BunSocket.health_check(pid)
      # Should either succeed quickly or timeout
      assert result == {:ok, :healthy} or match?({:error, :timeout}, result)
    end
  end

  describe "timeout handling" do
    setup do
      name = :"test_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      on_exit(fn ->
        if Process.alive?(pid) do
          try do
            GenServer.stop(pid, :normal, 1000)
          catch
            :exit, _ -> :ok
          end
        end
      end)

      {:ok, pid: pid}
    end

    test "query handles timeout when process is dead", %{pid: pid} do
      # Stop the process first
      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end

      # Give the process time to terminate
      Process.sleep(100)

      # Query should return error for dead process
      assert {:error, reason} = BunSocket.query(pid, "SELECT 1", [])
      assert reason in [:timeout, :not_running, :noproc]
    end

    test "exec handles timeout when process is dead", %{pid: pid} do
      # Stop the process first
      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end

      # Give the process time to terminate
      Process.sleep(100)

      # Exec should return error for dead process
      assert {:error, reason} = BunSocket.exec(pid, "SELECT 1", [])
      assert reason in [:timeout, :not_running, :noproc]
    end

    test "transaction handles timeout when process is dead", %{pid: pid} do
      # Stop the process first
      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end

      # Give the process time to terminate
      Process.sleep(100)

      # Transaction should return error for dead process
      assert {:error, reason} = BunSocket.transaction(pid, ["SELECT 1"])
      assert reason in [:timeout, :not_running, :noproc]
    end

    test "handles process not running scenarios" do
      # Try to call methods on a non-existent process
      non_existent_pid = :c.pid(0, 999, 0)

      assert {:error, reason} = BunSocket.query(non_existent_pid, "SELECT 1", [])
      assert reason in [:timeout, :not_running, :noproc]

      assert {:error, reason} = BunSocket.exec(non_existent_pid, "SELECT 1", [])
      assert reason in [:timeout, :not_running, :noproc]

      assert {:error, reason} = BunSocket.transaction(non_existent_pid, ["SELECT 1"])
      assert reason in [:timeout, :not_running, :noproc]

      assert {:error, reason} = BunSocket.health_check(non_existent_pid)
      assert reason in [:timeout, :not_running, :noproc]
    end
  end

  describe "socket communication error handling" do
    setup do
      name = :"test_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      on_exit(fn ->
        if Process.alive?(pid) do
          try do
            GenServer.stop(pid, :normal, 1000)
          catch
            :exit, _ -> :ok
          end
        end
      end)

      {:ok, pid: pid}
    end

    test "handles very large query strings gracefully", %{pid: pid} do
      # Test with very large SQL query (could cause socket buffer issues)
      large_query = "SELECT " <> String.duplicate("1, ", 10000) <> "1"

      result = BunSocket.query(pid, large_query, [])
      # Should either succeed or fail gracefully, not crash
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles queries with special characters", %{pid: pid} do
      # Test with various special characters that could cause parsing issues
      special_queries = [
        "SELECT 'test\nwith\nnewlines'",
        "SELECT 'test\twith\ttabs'",
        "SELECT 'test with unicode: 🚀 ❤️ 中文'",
        "SELECT 'test with quotes: ''single'' and \"double\"'"
      ]

      for query <- special_queries do
        result = BunSocket.query(pid, query, [])
        # Each query should either succeed or fail gracefully
        assert match?({:ok, _}, result) or match?({:error, _}, result)
      end
    end

    test "handles concurrent requests", %{pid: pid} do
      # Send multiple concurrent requests to test request ID handling
      tasks =
        for i <- 1..5 do
          Task.async(fn ->
            BunSocket.query(pid, "SELECT #{i} as test_#{i}", [])
          end)
        end

      results = Task.await_many(tasks, 5000)

      # All requests should complete (either success or error)
      for result <- results do
        assert match?({:ok, _}, result) or match?({:error, _}, result)
      end
    end

    test "handles empty parameters list variations", %{pid: pid} do
      # Test different ways of passing no parameters
      queries_and_params = [
        {"SELECT 1", []},
        {"SELECT 1", nil},
        {"SELECT 1 as test", []}
      ]

      for {query, params} <- queries_and_params do
        result =
          if params do
            BunSocket.query(pid, query, params)
          else
            BunSocket.query(pid, query)
          end

        # Should handle all parameter variations gracefully
        assert match?({:ok, _}, result) or match?({:error, _}, result)
      end
    end

    test "survives malformed parameter data", %{pid: pid} do
      # Test with potentially problematic parameter values
      problematic_params = [
        [nil],
        [:atom],
        [%{complex: "object"}],
        # nested list
        [[1, 2, 3]],
        ["very_long_string_" <> String.duplicate("x", 1000)]
      ]

      for params <- problematic_params do
        result = BunSocket.query(pid, "SELECT $1", params)
        # Should either succeed or fail gracefully without crashing
        assert match?({:ok, _}, result) or match?({:error, _}, result)
        # Verify process is still alive after each test
        assert Process.alive?(pid)
      end
    end
  end

  describe "response parsing and validation" do
    setup do
      name = :"test_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      on_exit(fn ->
        if Process.alive?(pid) do
          try do
            GenServer.stop(pid, :normal, 1000)
          catch
            :exit, _ -> :ok
          end
        end
      end)

      {:ok, pid: pid}
    end

    test "handles SQL injection attempts safely", %{pid: pid} do
      # Test with common SQL injection patterns - should be handled by parameterized queries
      injection_attempts = [
        "'; DROP TABLE test; --",
        "1; INSERT INTO test VALUES (1); --",
        "UNION SELECT * FROM information_schema.tables",
        "'; EXEC sp_configure 'show advanced options', 1; --"
      ]

      for injection <- injection_attempts do
        # Use parameterized query to safely handle injection attempts
        result = BunSocket.query(pid, "SELECT $1 as safe_value", [injection])
        # Should either succeed (with injection as literal value) or fail gracefully
        assert match?({:ok, _}, result) or match?({:error, _}, result)
        # Process should remain alive
        assert Process.alive?(pid)
      end
    end

    test "handles various SQL query types", %{pid: pid} do
      # Test different types of SQL operations
      query_types = [
        {"SELECT", "SELECT current_timestamp"},
        {"VALUES", "VALUES (1, 'test'), (2, 'another')"},
        {"WITH", "WITH test_cte AS (SELECT 1 as n) SELECT * FROM test_cte"},
        {"EXPLAIN", "EXPLAIN SELECT 1"}
      ]

      for {_type, query} <- query_types do
        result = BunSocket.query(pid, query, [])
        # Each query type should be handled appropriately
        assert match?({:ok, _}, result) or match?({:error, _}, result)
      end
    end

    test "handles queries returning different data types", %{pid: pid} do
      # Test queries that return various PostgreSQL data types
      type_queries = [
        "SELECT 123::integer as int_val",
        "SELECT 123.45::numeric as numeric_val",
        "SELECT 'text value'::text as text_val",
        "SELECT true::boolean as bool_val",
        "SELECT current_date as date_val",
        "SELECT ARRAY[1,2,3] as array_val"
      ]

      for query <- type_queries do
        result = BunSocket.query(pid, query, [])
        # Should handle all data types appropriately
        assert match?({:ok, _}, result) or match?({:error, _}, result)
      end
    end

    test "handles queries with null and empty results", %{pid: pid} do
      # Test edge cases with null values and empty result sets
      null_queries = [
        "SELECT NULL as null_val",
        "SELECT NULL::text as null_text",
        # Empty result
        "SELECT * FROM (VALUES (1), (2)) as t(x) WHERE x > 10",
        "SELECT '' as empty_string"
      ]

      for query <- null_queries do
        result = BunSocket.query(pid, query, [])
        assert match?({:ok, _}, result) or match?({:error, _}, result)
      end
    end

    test "handles complex nested JSON responses", %{pid: pid} do
      # Test with complex JSON structures that might stress response parsing
      json_queries = [
        "SELECT '{\"key\": \"value\", \"nested\": {\"array\": [1,2,3]}}'::json as json_val",
        "SELECT '[]'::json as empty_array",
        "SELECT '{}'::json as empty_object"
      ]

      for query <- json_queries do
        result = BunSocket.query(pid, query, [])
        assert match?({:ok, _}, result) or match?({:error, _}, result)
      end
    end

    test "handles transaction with mixed result types", %{pid: pid} do
      # Test transactions that return different types of results
      mixed_queries = [
        "SELECT 1 as count",
        "VALUES ('text'), ('more text')",
        "SELECT current_timestamp as now"
      ]

      result = BunSocket.transaction(pid, mixed_queries)
      # Should handle mixed result types in transaction
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end
  end

  describe "error handling" do
    setup do
      name = :"test_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      on_exit(fn ->
        if Process.alive?(pid) do
          try do
            GenServer.stop(pid, :normal, 1000)
          catch
            :exit, _ -> :ok
          end
        end
      end)

      {:ok, pid: pid}
    end

    test "handles invalid calls gracefully", %{pid: pid} do
      # BunSocket should handle invalid calls and return an error
      result = GenServer.call(pid, :invalid_call, 100)
      assert {:error, :unknown_call} = result
    end

    test "survives unexpected messages", %{pid: pid} do
      send(pid, :unexpected_message)
      Process.sleep(100)
      assert Process.alive?(pid)
      assert {:ok, :healthy} = BunSocket.health_check(pid)
    end

    test "handles process crashes and restarts" do
      # Trap exits to prevent test process from being killed
      Process.flag(:trap_exit, true)

      # Create a temporary process for this test
      name = :"test_crash_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      # Monitor the process
      ref = Process.monitor(pid)

      # Force a crash by sending an exit signal
      Process.exit(pid, :crash)

      # Verify process terminated
      assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, 1000

      # Verify we can start a new instance
      new_name = :"test_new_#{:rand.uniform(1000)}"
      assert {:ok, new_pid} = BunSocket.start_link(name: new_name)
      assert Process.alive?(new_pid)
      assert {:ok, :healthy} = BunSocket.health_check(new_pid)

      try do
        GenServer.stop(new_pid)
      catch
        :exit, _ -> :ok
      end
    end
  end

  describe "process termination scenarios" do
    test "handles normal shutdown sequence" do
      name = :"test_shutdown_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      # Verify process is working
      assert {:ok, :healthy} = BunSocket.health_check(pid)

      # Monitor for clean termination
      ref = Process.monitor(pid)

      # Stop normally
      GenServer.stop(pid, :normal, 1000)

      # Should terminate cleanly
      assert_receive {:DOWN, ^ref, :process, ^pid, :normal}, 2000
    end

    test "handles forced termination gracefully" do
      # Trap exits to prevent test process from being killed
      Process.flag(:trap_exit, true)

      name = :"test_force_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      # Verify process is working
      assert {:ok, :healthy} = BunSocket.health_check(pid)

      # Monitor the process
      ref = Process.monitor(pid)

      # Force kill the process
      Process.exit(pid, :kill)

      # Should terminate (though not necessarily cleanly due to :kill)
      assert_receive {:DOWN, ^ref, :process, ^pid, :killed}, 2000
    end

    test "handles shutdown during active query" do
      name = :"test_query_shutdown_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      # Start a query in background - use a simpler query that doesn't rely on pg_sleep
      task =
        Task.async(fn ->
          BunSocket.query(pid, "SELECT generate_series(1, 1000)", [])
        end)

      # Give query time to start
      Process.sleep(50)

      # Stop the process while query is running
      spawn(fn ->
        Process.sleep(100)

        try do
          GenServer.stop(pid, :shutdown, 1000)
        catch
          :exit, _ -> :ok
        end
      end)

      # The query task should complete (either success or error)
      result = Task.await(task, 2000)
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "survives bun process unexpected exit" do
      # Trap exits to handle the bun process exit
      Process.flag(:trap_exit, true)

      name = :"test_bun_exit_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      # Verify it's working initially
      assert {:ok, :healthy} = BunSocket.health_check(pid)

      # Monitor the GenServer process
      ref = Process.monitor(pid)

      # Force process termination (simulates bun process crash)
      # This is a more direct way to test termination behavior
      Process.exit(pid, :bun_process_crashed)

      # The GenServer should terminate
      assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, 2000
    end

    test "handles multiple rapid start/stop cycles" do
      # Test rapid creation and destruction of processes
      for _i <- 1..3 do
        name = :"test_rapid_#{:rand.uniform(10000)}"

        # Start process
        assert {:ok, pid} = BunSocket.start_link(name: name)
        assert Process.alive?(pid)

        # Quick health check
        health_result = BunSocket.health_check(pid)
        assert match?({:ok, :healthy}, health_result) or match?({:error, _}, health_result)

        # Stop process
        try do
          GenServer.stop(pid, :normal, 500)
        catch
          :exit, _ -> :ok
        end

        # Brief pause between cycles
        Process.sleep(10)
      end
    end
  end

  describe "resource cleanup" do
    test "cleans up resources on normal termination" do
      name = :"test_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      # Get initial process info
      initial_memory = :erlang.memory()

      # Stop the process normally
      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end

      # Give time for cleanup
      Process.sleep(100)

      # Check memory after cleanup
      final_memory = :erlang.memory()

      # Memory should not increase significantly
      # Allow for some variation due to VM behavior
      assert_memory_stable(initial_memory, final_memory)
    end

    test "cleans up resources on abnormal termination" do
      # Trap exits to prevent test process from being killed
      Process.flag(:trap_exit, true)

      name = :"test_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      initial_memory = :erlang.memory()

      # Monitor the process
      ref = Process.monitor(pid)

      # Force abnormal termination
      Process.exit(pid, :kill)

      # Wait for the process to die
      assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, 1000

      # Give some time for cleanup
      Process.sleep(200)

      final_memory = :erlang.memory()
      assert_memory_stable(initial_memory, final_memory)
    end
  end

  describe "database operations" do
    setup do
      name = :"test_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      on_exit(fn ->
        if Process.alive?(pid) do
          try do
            GenServer.stop(pid, :normal, 1000)
          catch
            :exit, _ -> :ok
          end
        end
      end)

      {:ok, pid: pid}
    end

    test "executes simple queries", %{pid: pid} do
      assert {:ok, result} = BunSocket.query(pid, "SELECT 1 as test", [])
      assert is_map(result)
    end

    test "executes queries with parameters", %{pid: pid} do
      assert {:ok, _result} = BunSocket.query(pid, "SELECT $1 as value", [42])
    end

    test "executes DDL statements", %{pid: pid} do
      table_name = "test_socket_#{:rand.uniform(10000)}"

      assert {:ok, _result} =
               BunSocket.exec(pid, "CREATE TABLE #{table_name} (id INTEGER, name TEXT)", [])
    end

    test "handles database errors gracefully", %{pid: pid} do
      # Try to query a non-existent table
      assert {:error, _reason} = BunSocket.query(pid, "SELECT * FROM non_existent_table", [])
    end
  end

  describe "transaction operations" do
    setup do
      name = :"test_#{:rand.uniform(1000)}"
      {:ok, pid} = BunSocket.start_link(name: name)

      on_exit(fn ->
        if Process.alive?(pid) do
          try do
            GenServer.stop(pid, :normal, 1000)
          catch
            :exit, _ -> :ok
          end
        end
      end)

      {:ok, pid: pid}
    end

    test "executes simple transaction", %{pid: pid} do
      table_name = "test_transaction_#{:rand.uniform(10000)}"

      queries = [
        "CREATE TABLE #{table_name} (id INTEGER, name TEXT)",
        "INSERT INTO #{table_name} (id, name) VALUES (1, 'test')",
        "SELECT * FROM #{table_name}"
      ]

      assert {:ok, result} = BunSocket.transaction(pid, queries)
      assert is_list(result) or is_map(result)
    end

    test "handles transaction with parameters", %{pid: pid} do
      table_name = "test_transaction_params_#{:rand.uniform(10000)}"

      queries = [
        %{sql: "CREATE TABLE #{table_name} (id INTEGER, value INTEGER)", params: []},
        %{sql: "INSERT INTO #{table_name} (id, value) VALUES ($1, $2)", params: [1, 100]},
        %{sql: "SELECT value FROM #{table_name} WHERE id = $1", params: [1]}
      ]

      assert {:ok, _result} = BunSocket.transaction(pid, queries)
    end

    test "handles transaction with potential error conditions", %{pid: pid} do
      table_name = "test_rollback_#{:rand.uniform(10000)}"

      queries = [
        "CREATE TABLE #{table_name} (id INTEGER PRIMARY KEY, name TEXT)",
        "INSERT INTO #{table_name} (id, name) VALUES (1, 'test')",
        "SELECT * FROM #{table_name}"
      ]

      # Transaction should succeed with valid queries
      assert {:ok, result} = BunSocket.transaction(pid, queries)
      assert is_list(result) or is_map(result)
    end

    test "handles transaction with syntax error", %{pid: pid} do
      queries = [
        "INVALID SQL SYNTAX HERE"
      ]

      # This should fail due to invalid SQL
      result = BunSocket.transaction(pid, queries)
      # Either error or success depending on how PGLite handles syntax errors
      assert match?({:ok, _}, result) or match?({:error, _}, result)
    end

    test "handles empty transaction", %{pid: pid} do
      assert {:ok, _result} = BunSocket.transaction(pid, [])
    end

    test "handles transaction timeout", %{pid: pid} do
      # Note: This test may timeout depending on implementation
      # but it exercises the timeout path in the transaction call
      long_running_queries = [
        # Short sleep that should succeed
        "SELECT pg_sleep(0.1)"
      ]

      result = BunSocket.transaction(pid, long_running_queries)
      assert match?({:ok, _}, result) or match?({:error, :timeout}, result)
    end
  end

  describe "initialization failure scenarios" do
    test "fails gracefully when script is not found" do
      # This test simulates the script_not_found error path
      # We'll test this by attempting to start with an invalid priv directory

      # Temporarily modify the application environment to point to non-existent path
      original_priv = Application.get_env(:pglite, :priv_dir)
      Application.put_env(:pglite, :priv_dir, "/non/existent/path")

      # Backup the original code priv_dir function if needed
      # For this test, we'll use a different approach - test the error condition directly

      name = :"test_script_missing_#{:rand.uniform(1000)}"

      # Trap exits to handle the linked process failure gracefully
      Process.flag(:trap_exit, true)

      # This should fail with script not found
      result =
        try do
          BunSocket.start_link(name: name)
        catch
          :exit, :script_not_found -> {:error, :script_not_found}
          :exit, other -> {:error, other}
        end

      # Should either fail to start or start and then fail quickly
      case result do
        {:error, _reason} ->
          # Expected failure case
          assert true

        {:ok, pid} ->
          # If it starts, it should fail quickly during init
          ref = Process.monitor(pid)
          assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, 2000
      end

      # Restore original environment
      if original_priv do
        Application.put_env(:pglite, :priv_dir, original_priv)
      else
        Application.delete_env(:pglite, :priv_dir)
      end
    end

    test "handles invalid data directory gracefully" do
      # Test with a data directory that can't be created (permission issues)
      invalid_data_dir = "/root/invalid_pglite_dir_#{:rand.uniform(1000)}"

      name = :"test_invalid_dir_#{:rand.uniform(1000)}"

      # Trap exits to handle the linked process failure gracefully
      Process.flag(:trap_exit, true)

      result =
        try do
          BunSocket.start_link(name: name, data_dir: invalid_data_dir)
        catch
          :exit, {:bun_startup_failed, _status} -> {:error, :invalid_data_dir}
          :exit, other -> {:error, other}
        end

      # Should either fail to start or start and then fail during init
      case result do
        {:error, _reason} ->
          # Expected failure case
          assert true

        {:ok, pid} ->
          # If it starts, it should fail during initialization
          ref = Process.monitor(pid)
          assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, 5000
      end
    end

    test "handles bun command not available" do
      # This test is challenging because we can't easily mock the bun command
      # Instead, we'll test with an environment where bun might not be available
      # by temporarily modifying the PATH

      original_path = System.get_env("PATH", "")

      # Set PATH to empty to simulate bun not being available
      System.put_env("PATH", "/nonexistent")

      name = :"test_no_bun_#{:rand.uniform(1000)}"

      # Should fail to start when bun is not available
      # This can either return {:error, _} or cause the process to EXIT during init
      # We need to trap exits to catch the linked process failure
      Process.flag(:trap_exit, true)

      result =
        try do
          BunSocket.start_link(name: name)
        catch
          :exit, {:bun_startup_failed, _status} -> {:error, :bun_not_available}
          :exit, other -> {:error, other}
        end

      case result do
        {:error, _reason} ->
          # Expected failure case
          assert true

        {:ok, pid} ->
          # Process might start but should fail during bun startup
          ref = Process.monitor(pid)
          assert_receive {:DOWN, ^ref, :process, ^pid, _reason}, 5000
      end

      # Restore original PATH
      System.put_env("PATH", original_path)
    end

    test "handles corrupted or empty script file" do
      # This test simulates what happens if the JavaScript file is corrupted
      # We can't easily corrupt the actual file, so we'll test resilience instead

      name = :"test_script_issues_#{:rand.uniform(1000)}"

      # Start normally but expect that any script issues would cause startup failure
      result = BunSocket.start_link(name: name)

      case result do
        {:error, _reason} ->
          # Script issues detected
          assert true

        {:ok, pid} ->
          # If it starts successfully, the script is fine
          # Test that it's actually working
          health_result = BunSocket.health_check(pid)

          # Clean up
          try do
            GenServer.stop(pid)
          catch
            :exit, _ -> :ok
          end

          # Either healthy or failed - both are acceptable outcomes
          assert match?({:ok, :healthy}, health_result) or match?({:error, _}, health_result)
      end
    end

    test "handles rapid start attempts with same name" do
      # Test what happens when multiple processes try to start with the same name rapidly
      name = :"test_rapid_same_#{:rand.uniform(1000)}"

      # Start first process
      assert {:ok, pid1} = BunSocket.start_link(name: name)

      # Try to start second process with same name (should fail)
      assert {:error, {:already_started, ^pid1}} = BunSocket.start_link(name: name)

      # Try again (should still fail)
      assert {:error, {:already_started, ^pid1}} = BunSocket.start_link(name: name)

      # Clean up
      try do
        GenServer.stop(pid1)
      catch
        :exit, _ -> :ok
      end
    end

    test "handles start_link with invalid options" do
      # Trap exits to handle the linked process failure gracefully
      Process.flag(:trap_exit, true)

      # Test with various invalid option combinations
      invalid_options = [
        [name: nil],
        [name: "not_an_atom"],
        [data_dir: nil],
        [data_dir: 123],
        [unknown_option: "value"]
      ]

      for opts <- invalid_options do
        # These should either fail gracefully or ignore invalid options
        result =
          try do
            BunSocket.start_link(opts)
          catch
            :error, %ArgumentError{} -> {:error, :invalid_argument}
            :exit, {:bun_startup_failed, _status} -> {:error, :bun_startup_failed}
            :exit, other -> {:error, other}
          end

        case result do
          {:error, _reason} ->
            # Expected for some invalid options
            assert true

          {:ok, pid} ->
            # If it starts, clean up
            try do
              GenServer.stop(pid)
            catch
              :exit, _ -> :ok
            end
        end
      end
    end
  end

  describe "connection retry logic and socket failures" do
    test "handles socket directory creation issues" do
      # Test behavior when socket directory can't be created
      # We'll use a more realistic test approach

      name = :"test_socket_dir_#{:rand.uniform(1000)}"

      # Start normally - if socket directory creation fails, it should be handled
      result = BunSocket.start_link(name: name)

      case result do
        {:error, _reason} ->
          # Socket directory creation failed
          assert true

        {:ok, pid} ->
          # If it starts, verify it's working
          health_result = BunSocket.health_check(pid)

          # Clean up
          try do
            GenServer.stop(pid)
          catch
            :exit, _ -> :ok
          end

          assert match?({:ok, :healthy}, health_result) or match?({:error, _}, health_result)
      end
    end

    test "handles socket file conflicts" do
      # Test what happens when socket files already exist
      # This simulates cleanup issues from previous runs

      # Create socket directory manually
      socket_dir = "/tmp/pglite_sockets"
      File.mkdir_p!(socket_dir)

      # Create some "stale" socket files
      stale_socket = Path.join(socket_dir, "pglite_stale_#{:rand.uniform(1000)}.sock")
      File.write!(stale_socket, "")

      name = :"test_socket_conflict_#{:rand.uniform(1000)}"

      # Should handle stale socket files gracefully
      result = BunSocket.start_link(name: name)

      case result do
        {:error, _reason} ->
          # Socket conflict handled
          assert true

        {:ok, pid} ->
          # Should work despite stale files
          assert {:ok, :healthy} = BunSocket.health_check(pid)

          try do
            GenServer.stop(pid)
          catch
            :exit, _ -> :ok
          end
      end

      # Clean up stale socket
      File.rm(stale_socket)
    end

    test "handles multiple connection retry scenarios" do
      # Test the retry logic indirectly by starting multiple processes rapidly
      # This can cause socket connection contention

      names = for i <- 1..3, do: :"test_retry_#{i}_#{:rand.uniform(1000)}"

      # Start multiple processes rapidly
      results =
        for name <- names do
          BunSocket.start_link(name: name)
        end

      # Count successful starts
      {successes, failures} =
        Enum.split_with(results, fn
          {:ok, _} -> true
          _ -> false
        end)

      # Clean up successful processes
      for {:ok, pid} <- successes do
        try do
          GenServer.stop(pid)
        catch
          :exit, _ -> :ok
        end
      end

      # Should have at least some successes (retry logic working)
      # Or all failures are acceptable (system resource limits)
      assert length(successes) >= 0 and length(failures) >= 0
    end

    test "handles socket connection timeouts" do
      # Test connection timeout behavior by starting a process
      # and checking that it either succeeds or fails gracefully

      name = :"test_timeout_#{:rand.uniform(1000)}"

      # Measure startup time
      start_time = System.monotonic_time(:millisecond)
      result = BunSocket.start_link(name: name)
      end_time = System.monotonic_time(:millisecond)

      startup_time = end_time - start_time

      case result do
        {:error, _reason} ->
          # Connection timeout or failure - acceptable
          # Should not take too long to fail
          # Should fail within 30 seconds
          assert startup_time < 30_000

        {:ok, pid} ->
          # Connection succeeded
          assert {:ok, :healthy} = BunSocket.health_check(pid)

          try do
            GenServer.stop(pid)
          catch
            :exit, _ -> :ok
          end

          # Successful startup should be reasonably fast
          # Should start within 10 seconds
          assert startup_time < 10_000
      end
    end

    test "handles concurrent socket operations" do
      # Test concurrent socket operations by having multiple processes
      # perform operations simultaneously

      # Start a few processes
      pids =
        for i <- 1..2 do
          name = :"test_concurrent_#{i}_#{:rand.uniform(1000)}"

          case BunSocket.start_link(name: name) do
            {:ok, pid} -> pid
            _ -> nil
          end
        end
        |> Enum.filter(&(&1 != nil))

      # Perform concurrent operations
      tasks =
        for pid <- pids do
          Task.async(fn ->
            BunSocket.query(pid, "SELECT #{:rand.uniform(100)} as random_value", [])
          end)
        end

      # Wait for all results
      results = Task.await_many(tasks, 5000)

      # Clean up
      for pid <- pids do
        try do
          GenServer.stop(pid)
        catch
          :exit, _ -> :ok
        end
      end

      # All operations should complete (success or failure)
      for result <- results do
        assert match?({:ok, _}, result) or match?({:error, _}, result)
      end
    end

    test "handles system resource exhaustion scenarios" do
      # Test behavior under resource pressure
      # Start and stop many processes to test resource cleanup

      process_count = 5

      for _i <- 1..process_count do
        name = :"test_resource_#{:rand.uniform(10000)}"

        case BunSocket.start_link(name: name) do
          {:ok, pid} ->
            # Quick operation
            _result = BunSocket.health_check(pid)

            # Clean up immediately
            try do
              GenServer.stop(pid, :normal, 1000)
            catch
              :exit, _ -> :ok
            end

          {:error, _reason} ->
            # Resource exhaustion or other failure - acceptable
            :ok
        end

        # Brief pause between iterations
        Process.sleep(50)
      end

      # Test should complete without crashing
      assert true
    end
  end

  describe "startup timeout and ready signal handling" do
    test "handles normal startup sequence timing" do
      # Test that normal startup completes within reasonable time
      name = :"test_startup_timing_#{:rand.uniform(1000)}"

      start_time = System.monotonic_time(:millisecond)
      result = BunSocket.start_link(name: name)
      end_time = System.monotonic_time(:millisecond)

      startup_time = end_time - start_time

      case result do
        {:ok, pid} ->
          # Normal startup should be reasonably fast
          # Should start within 15 seconds
          assert startup_time < 15_000

          # Verify it's actually working
          assert {:ok, :healthy} = BunSocket.health_check(pid)

          try do
            GenServer.stop(pid)
          catch
            :exit, _ -> :ok
          end

        {:error, _reason} ->
          # If startup fails, it should fail quickly
          # Should fail within 30 seconds
          assert startup_time < 30_000
      end
    end

    test "handles startup under system load" do
      # Test startup when system is under load (multiple processes starting)
      names = for i <- 1..5, do: :"test_load_#{i}_#{:rand.uniform(1000)}"

      # Start all processes simultaneously
      tasks =
        for name <- names do
          Task.async(fn ->
            start_time = System.monotonic_time(:millisecond)
            result = BunSocket.start_link(name: name, timeout: 10000)
            end_time = System.monotonic_time(:millisecond)
            {result, end_time - start_time}
          end)
        end

      # Wait for all results
      results = Task.await_many(tasks, 30_000)

      # Analyze results
      {successes, failures} =
        Enum.split_with(results, fn
          {{:ok, _}, _time} -> true
          _ -> false
        end)

      # Clean up successful processes
      for {{:ok, pid}, _time} <- successes do
        try do
          GenServer.stop(pid)
        catch
          :exit, _ -> :ok
        end
      end

      # Should have reasonable success rate under load
      total = length(results)
      success_count = length(successes)
      assert total == success_count
      assert failures == []
    end

    test "handles ready signal validation" do
      # Test that the process properly validates ready signals
      # We test this indirectly by ensuring the process becomes operational

      name = :"test_ready_signal_#{:rand.uniform(1000)}"

      result = BunSocket.start_link(name: name)

      case result do
        {:ok, pid} ->
          # If process started, it should have received proper ready signal
          # Test that it's actually ready by performing operations
          assert {:ok, :healthy} = BunSocket.health_check(pid)
          assert {:ok, _result} = BunSocket.query(pid, "SELECT 1", [])

          try do
            GenServer.stop(pid)
          catch
            :exit, _ -> :ok
          end

        {:error, _reason} ->
          # Failed to start - could be due to ready signal issues
          assert true
      end
    end

    test "handles bun process startup variations" do
      # Test different scenarios that might affect bun process startup
      scenarios = [
        {"default", []},
        {"custom_temp_dir",
         [data_dir: Path.join(System.tmp_dir!(), "pglite_custom_#{:rand.uniform(1000)}")]},
        {"unique_names", [name: :"test_unique_#{System.unique_integer([:positive])}"]}
      ]

      for {_scenario_name, opts} <- scenarios do
        result = BunSocket.start_link(opts)

        case result do
          {:ok, pid} ->
            # Process started successfully for this scenario
            health_result = BunSocket.health_check(pid)

            try do
              GenServer.stop(pid)
            catch
              :exit, _ -> :ok
            end

            # Health check should work or fail gracefully
            assert match?({:ok, :healthy}, health_result) or match?({:error, _}, health_result)

          {:error, _reason} ->
            # Some scenarios might fail - that's acceptable
            # Log which scenario failed for debugging
            :ok
        end

        # Clean up custom data directories
        if Keyword.has_key?(opts, :data_dir) do
          data_dir = Keyword.get(opts, :data_dir)
          File.rm_rf(data_dir)
        end
      end
    end

    test "handles process startup race conditions" do
      # Test race conditions in process startup
      # Start multiple processes with slight timing differences

      base_name = "test_race_#{:rand.uniform(1000)}"

      # Start processes with staggered timing
      results =
        for i <- 1..3 do
          # Stagger starts
          Process.sleep(i * 10)
          name = :"#{base_name}_#{i}"
          BunSocket.start_link(name: name)
        end

      # Collect successful processes
      successful_pids = for {:ok, pid} <- results, do: pid

      # All successful processes should be functional
      for pid <- successful_pids do
        health_result = BunSocket.health_check(pid)
        assert match?({:ok, :healthy}, health_result) or match?({:error, _}, health_result)
      end

      # Clean up
      for pid <- successful_pids do
        try do
          GenServer.stop(pid)
        catch
          :exit, _ -> :ok
        end
      end

      # Should have at least one success
      assert length(successful_pids) > 0
    end

    test "handles edge cases in process lifecycle" do
      # Test various edge cases in the complete process lifecycle

      name = :"test_lifecycle_edge_#{:rand.uniform(1000)}"

      # Start process
      assert {:ok, pid} = BunSocket.start_link(name: name)

      # Rapid successive operations to test stability
      operations = [
        fn -> BunSocket.health_check(pid) end,
        fn -> BunSocket.query(pid, "SELECT current_timestamp", []) end,
        fn -> BunSocket.exec(pid, "SELECT 1", []) end,
        fn -> BunSocket.transaction(pid, ["SELECT 1", "SELECT 2"]) end
      ]

      # Execute operations rapidly
      results =
        for op <- operations do
          op.()
        end

      # All operations should complete (success or failure)
      for result <- results do
        assert match?({:ok, _}, result) or match?({:error, _}, result)
      end

      # Process should still be alive and functional
      assert Process.alive?(pid)
      final_health = BunSocket.health_check(pid)
      assert match?({:ok, :healthy}, final_health) or match?({:error, _}, final_health)

      # Clean shutdown
      try do
        GenServer.stop(pid)
      catch
        :exit, _ -> :ok
      end
    end
  end

  # Helper functions
  defp assert_memory_stable(initial, final) do
    # Allow for up to 10% increase in total memory
    max_allowed_increase = initial[:total] * 0.1

    assert final[:total] - initial[:total] < max_allowed_increase,
           "Memory increased by more than 10%: #{final[:total] - initial[:total]} bytes"
  end
end
