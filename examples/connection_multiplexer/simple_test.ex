defmodule ConnectionMultiplexer.Simple do
  @moduledoc """
  Simple test for connection multiplexer.
  """

  def run do
    IO.puts("\n=== Simple Multiplexer Test ===\n")

    {:ok, pglite} = Pglite.start_link()
    {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

    IO.puts("Executing simple queries...")

    # Simple query
    {:ok, result} = Postgrex.query(conn, "SELECT 1 AS num", [])
    [[num]] = result.rows
    IO.puts("✓ Query 1: SELECT 1 => #{num}")

    # Another simple query
    {:ok, result} = Postgrex.query(conn, "SELECT 2 AS num", [])
    [[num]] = result.rows
    IO.puts("✓ Query 2: SELECT 2 => #{num}")

    # Create table
    {:ok, _} = Postgrex.query(conn, "CREATE TABLE test (id INTEGER, value TEXT)", [])
    IO.puts("✓ Created table")

    # Insert
    {:ok, _} = Postgrex.query(conn, "INSERT INTO test VALUES (1, 'hello')", [])
    IO.puts("✓ Inserted row")

    # Select
    {:ok, result} = Postgrex.query(conn, "SELECT * FROM test", [])
    IO.puts("✓ Selected: #{inspect(result.rows)}")

    GenServer.stop(conn)
    GenServer.stop(pglite)

    IO.puts("\n=== Test Complete ===\n")
  end
end
