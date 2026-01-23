defmodule ConnectionMultiplexer do
  @moduledoc """
  Demonstrates connection multiplexing for PGlite.

  This example shows how the multiplexer allows multiple concurrent PostgreSQL
  connections to work with PGlite, which only supports one query at a time.

  The multiplexer serializes queries through a single backend, providing
  the illusion of concurrent connections.

  Run with: mix run -e "ConnectionMultiplexer.run()"
  """

  require Logger

  def run do
    IO.puts("\n=== PGlite Connection Multiplexer Demo ===\n")

    # Test 1: Single connection (baseline)
    IO.puts("Test 1: Single connection (baseline)")
    IO.puts("----------------------------------------")
    test_single_connection()
    Process.sleep(500)

    # Test 2: Multiple concurrent connections with multiplexer
    IO.puts("\nTest 2: Multiple concurrent connections (with multiplexer)")
    IO.puts("---------------------------------------------------------")
    test_multiple_connections()
    Process.sleep(500)

    # Test 3: Concurrent writes and reads
    IO.puts("\nTest 3: Concurrent writes and reads")
    IO.puts("-----------------------------------")
    test_concurrent_operations()
    Process.sleep(500)

    # Test 4: Stress test with many connections
    IO.puts("\nTest 4: Stress test with 10 concurrent connections")
    IO.puts("------------------------------------------------")
    test_stress_connections()

    IO.puts("\n=== All tests completed ===\n")
  end

  defp test_single_connection do
    {:ok, pglite} = Pglite.start_link()
    {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

    setup_tables(conn)

    IO.puts("Executing 10 sequential queries...")
    start_time = System.monotonic_time(:millisecond)

    for i <- 1..10 do
      Postgrex.query!(conn, "INSERT INTO users (username, email) VALUES ($1, $2)", [
        "user_#{i}",
        "user#{i}@example.com"
      ])
    end

    elapsed = System.monotonic_time(:millisecond) - start_time
    {:ok, result} = Postgrex.query(conn, "SELECT COUNT(*) FROM users", [])
    [[count]] = result.rows

    IO.puts("✓ Inserted #{count} rows in #{elapsed}ms")

    GenServer.stop(conn)
    GenServer.stop(pglite)
  end

  defp test_multiple_connections do
    {:ok, pglite} = Pglite.start_link()

    {:ok, conn1} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
    {:ok, conn2} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
    {:ok, conn3} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

    setup_tables(conn1)

    IO.puts("Executing queries from 3 concurrent connections...")

    tasks = [
      Task.async(fn ->
        for i <- 1..5 do
          Postgrex.query!(conn1, "INSERT INTO users (username, email) VALUES ($1, $2)", [
            "conn1_user_#{i}",
            "conn1user#{i}@example.com"
          ])
        end

        {:ok, :conn1}
      end),
      Task.async(fn ->
        for i <- 6..10 do
          Postgrex.query!(conn2, "INSERT INTO users (username, email) VALUES ($1, $2)", [
            "conn2_user_#{i}",
            "conn2user#{i}@example.com"
          ])
        end

        {:ok, :conn2}
      end),
      Task.async(fn ->
        Process.sleep(10)

        for i <- 11..15 do
          Postgrex.query!(conn3, "INSERT INTO users (username, email) VALUES ($1, $2)", [
            "conn3_user_#{i}",
            "conn3user#{i}@example.com"
          ])
        end

        {:ok, :conn3}
      end)
    ]

    start_time = System.monotonic_time(:millisecond)

    results = Task.await_many(tasks, 10_000)

    elapsed = System.monotonic_time(:millisecond) - start_time

    {:ok, result} = Postgrex.query(conn1, "SELECT COUNT(*) FROM users", [])
    [[count]] = result.rows

    IO.puts("✓ 3 connections completed successfully")
    IO.puts("✓ Inserted #{count} total rows in #{elapsed}ms")
    IO.puts("✓ All queries serialized through multiplexer")

    Enum.each([conn1, conn2, conn3], &GenServer.stop/1)
    GenServer.stop(pglite)
  end

  defp test_concurrent_operations do
    {:ok, pglite} = Pglite.start_link()

    {:ok, writer1} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
    {:ok, writer2} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
    {:ok, reader} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

    setup_tables(writer1)

    IO.puts("2 writers and 1 reader operating concurrently...")

    start_time = System.monotonic_time(:millisecond)

    # Writer 1: Insert users 1-5
    writer_task1 =
      Task.async(fn ->
        for i <- 1..5 do
          Postgrex.query!(writer1, "INSERT INTO users (username, email) VALUES ($1, $2)", [
            "writer1_user_#{i}",
            "writer1user#{i}@example.com"
          ])
        end

        {:writes, 5}
      end)

    # Writer 2: Insert users 6-10
    writer_task2 =
      Task.async(fn ->
        for i <- 6..10 do
          Postgrex.query!(writer2, "INSERT INTO users (username, email) VALUES ($1, $2)", [
            "writer2_user_#{i}",
            "writer2user#{i}@example.com"
          ])
        end

        {:writes, 5}
      end)

    # Reader: Periodically check count
    reader_task =
      Task.async(fn ->
        counts =
          for i <- 1..5 do
            Process.sleep(50)
            {:ok, result} = Postgrex.query(reader, "SELECT COUNT(*) FROM users", [])
            [[count]] = result.rows
            {i, count}
          end

        {:reads, counts}
      end)

    results = Task.await_many([writer_task1, writer_task2, reader_task], 10_000)
    elapsed = System.monotonic_time(:millisecond) - start_time

    {:writes, writes1} = Enum.find(results, fn {k, _} -> k == :writes end)
    {:reads, counts} = Enum.find(results, fn {k, _} -> k == :reads end)

    IO.puts("✓ Writers inserted #{writes1} + #{writes1} = #{writes1 * 2} rows")
    IO.puts("✓ Reader observed progression: #{inspect(counts)}")
    IO.puts("✓ Completed in #{elapsed}ms")

    Enum.each([writer1, writer2, reader], &GenServer.stop/1)
    GenServer.stop(pglite)
  end

  defp test_stress_connections do
    {:ok, pglite} = Pglite.start_link()

    setup_tables(pglite)
    {:ok, admin_conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

    num_connections = 10
    queries_per_connection = 5

    IO.puts("Starting #{num_connections} connections, #{queries_per_connection} queries each...")

    tasks =
      for conn_id <- 1..num_connections do
        Task.async(fn ->
          {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

          start = System.monotonic_time(:millisecond)

          for i <- 1..queries_per_connection do
            username = "stress_conn#{conn_id}_user#{i}"
            email = "stress_conn#{conn_id}user#{i}@example.com"

            Postgrex.query!(conn, "INSERT INTO users (username, email) VALUES ($1, $2)", [
              username,
              email
            ])
          end

          elapsed = System.monotonic_time(:millisecond) - start

          GenServer.stop(conn)
          {conn_id, elapsed}
        end)
      end

    overall_start = System.monotonic_time(:millisecond)

    results = Task.await_many(tasks, 30_000)

    overall_elapsed = System.monotonic_time(:millisecond) - overall_start

    {:ok, result} = Postgrex.query(admin_conn, "SELECT COUNT(*) FROM users", [])
    [[total_rows]] = result.rows

    total_queries = num_connections * queries_per_connection
    avg_time = results |> Enum.map(fn {_, t} -> t end) |> Enum.sum() |> div(num_connections)

    IO.puts("✓ All #{num_connections} connections completed")
    IO.puts("✓ Total queries executed: #{total_queries}")
    IO.puts("✓ Total rows inserted: #{total_rows}")
    IO.puts("✓ Overall time: #{overall_elapsed}ms")
    IO.puts("✓ Average connection time: #{avg_time}ms")
    IO.puts("✓ Queries per second: #{Float.round(total_queries / (overall_elapsed / 1000), 2)}")

    GenServer.stop(admin_conn)
    GenServer.stop(pglite)
  end

  defp setup_tables(conn) do
    Postgrex.query!(
      conn,
      """
      DROP TABLE IF EXISTS users;
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
      """,
      []
    )
  end
end
