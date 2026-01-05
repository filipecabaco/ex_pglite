defmodule SimpleQueries do
  @moduledoc """
  Basic database operations with PGlite.

  Run with: mix run -e "SimpleQueries.run()"
  """

  def run do
    {:ok, pglite} = Pglite.start_link()
    {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

    IO.puts("Started PGlite instance")

    {:ok, _} =
      Postgrex.query(
        conn,
        """
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        []
      )

    IO.puts("Created users table")

    {:ok, _} =
      Postgrex.query(
        conn,
        """
        INSERT INTO users (username, email) VALUES
          ('alice', 'alice@example.com'),
          ('bob', 'bob@example.com'),
          ('charlie', 'charlie@example.com')
        """,
        []
      )

    IO.puts("Inserted sample users")

    {:ok, result} = Postgrex.query(conn, "SELECT * FROM users ORDER BY id", [])
    IO.puts("\nAll users:")

    Enum.each(result.rows, fn [id, username, email, created_at] ->
      IO.puts("  #{id}: #{username} (#{email}) - #{created_at}")
    end)

    {:ok, result} = Postgrex.query(conn, "SELECT * FROM users WHERE username = $1", ["alice"])
    IO.puts("\nUser 'alice':")

    case result.rows do
      [[id, username, email, created_at]] ->
        IO.puts("  #{id}: #{username} (#{email}) - #{created_at}")

      [] ->
        IO.puts("  Not found")
    end

    {:ok, result} = Postgrex.query(conn, "SELECT COUNT(*) FROM users", [])
    [count] = List.first(result.rows)
    IO.puts("\nTotal users: #{count}")

    {:ok, _} =
      Postgrex.query(conn, "UPDATE users SET email = $1 WHERE username = $2", [
        "alice.new@example.com",
        "alice"
      ])

    {:ok, result} = Postgrex.query(conn, "SELECT email FROM users WHERE username = $1", ["alice"])
    [email] = List.first(result.rows)
    IO.puts("Updated alice's email to: #{email}")

    {:ok, _} = Postgrex.query(conn, "DELETE FROM users WHERE username = $1", ["charlie"])

    {:ok, result} = Postgrex.query(conn, "SELECT COUNT(*) FROM users", [])
    [count] = List.first(result.rows)
    IO.puts("Final user count: #{count}")

    GenServer.stop(conn)
    GenServer.stop(pglite)
    IO.puts("\nCleaned up")
  end
end
