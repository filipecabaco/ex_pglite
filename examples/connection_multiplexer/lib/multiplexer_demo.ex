defmodule MultiplexerDemo do
  @moduledoc """
  Demonstrates connection multiplexing for PGlite.

  Shows multiple concurrent connections working simultaneously through the multiplexer.
  """

  def run do
    IO.puts("\n=== PGlite Connection Multiplexer Demo ===\n")

    {:ok, pglite} = Pglite.start_link()

    IO.puts("Test 1: Basic queries")
    IO.puts("------------------------")
    test_basic_queries(pglite)
    Process.sleep(500)

    IO.puts("\nTest 2: Multiple concurrent connections")
    IO.puts("-------------------------------------")
    test_concurrent_connections(pglite)
    Process.sleep(500)

    IO.puts("\nTest 3: Stress test with multiple connections")
    IO.puts("----------------------------------------------")
    test_stress_connections(pglite)

    GenServer.stop(pglite)

    IO.puts("\n=== All tests completed ===\n")
  end

  defp test_basic_queries(pglite) do
    {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

    {:ok, result} = Postgrex.query(conn, "SELECT 1 AS num", [])
    [[num]] = result.rows
    IO.puts("✓ Query 1: #{num}")

    {:ok, result} = Postgrex.query(conn, "SELECT 2 AS num", [])
    [[num]] = result.rows
    IO.puts("✓ Query 2: #{num}")

    {:ok, result} = Postgrex.query(conn, "SELECT 3 AS num", [])
    [[num]] = result.rows
    IO.puts("✓ Query 3: #{num}")

    GenServer.stop(conn)
  end

  defp test_concurrent_connections(pglite) do
    {:ok, conn1} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
    {:ok, conn2} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
    {:ok, conn3} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

    tasks = [
      Task.async(fn ->
        {:ok, result} = Postgrex.query(conn1, "SELECT 1 AS conn1", [])
        [[num]] = result.rows
        {:conn1, num}
      end),
      Task.async(fn ->
        {:ok, result} = Postgrex.query(conn2, "SELECT 2 AS conn2", [])
        [[num]] = result.rows
        {:conn2, num}
      end),
      Task.async(fn ->
        {:ok, result} = Postgrex.query(conn3, "SELECT 3 AS conn3", [])
        [[num]] = result.rows
        {:conn3, num}
      end)
    ]

    start_time = System.monotonic_time(:millisecond)

    results = Task.await_many(tasks, 10_000)

    elapsed = System.monotonic_time(:millisecond) - start_time

    Enum.each(
      results,
      fn {name, num} ->
        IO.puts("✓ #{name}: #{num}")
      end
    )

    IO.puts("✓ All 3 connections completed in #{elapsed}ms")

    Enum.each([conn1, conn2, conn3], &GenServer.stop/1)
  end

  defp test_stress_connections(pglite) do
    num_connections = 3
    queries_per_conn = 2

    conn_opts =
      pglite
      |> Pglite.get_connection_opts()
      |> Keyword.put(:pool_size, 1)
      |> Keyword.put(:timeout, 30_000)
      |> Keyword.put(:connect_timeout, 30_000)

    tasks =
      for i <- 1..num_connections do
        Task.async(fn ->
          case Postgrex.start_link(conn_opts) do
            {:ok, conn} ->
              start = System.monotonic_time(:millisecond)

              results =
                for j <- 1..queries_per_conn do
                  case Postgrex.query(conn, "SELECT #{i * 10 + j} AS num", [], timeout: 30_000) do
                    {:ok, result} ->
                      [[num]] = result.rows
                      {:ok, num}

                    {:error, reason} ->
                      {:error, reason}
                  end
                end

              elapsed = System.monotonic_time(:millisecond) - start

              GenServer.stop(conn)
              {:ok, i, elapsed, results}

            {:error, reason} ->
              {:error, i, reason}
          end
        end)
      end

    start_time = System.monotonic_time(:millisecond)

    results = Task.await_many(tasks, 120_000)

    total_elapsed = System.monotonic_time(:millisecond) - start_time

    {successes, failures} =
      Enum.split_with(results, fn
        {:ok, _, _, _} -> true
        _ -> false
      end)

    if length(failures) > 0 do
      IO.puts("✗ #{length(failures)} connections failed:")

      Enum.each(failures, fn {:error, i, reason} ->
        IO.puts("  Connection #{i}: #{inspect(reason)}")
      end)
    end

    if length(successes) > 0 do
      total_queries = length(successes) * queries_per_conn
      avg_time = successes |> Enum.map(fn {:ok, _, t, _} -> t end) |> Enum.sum() |> div(length(successes))

      IO.puts("✓ #{length(successes)}/#{num_connections} connections completed (#{total_queries} queries)")
      IO.puts("✓ Total time: #{total_elapsed}ms")
      IO.puts("✓ Average connection time: #{avg_time}ms")

      if total_elapsed > 0 do
        IO.puts("✓ Queries per second: #{Float.round(total_queries / (total_elapsed / 1000), 2)}")
      end
    end
  end
end
