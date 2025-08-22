defmodule SimpleQueries do
  @moduledoc """
  Simple Queries Example

  This example demonstrates basic database operations with PGLite.
  Run with: mix run --no-halt -e "SimpleQueries.run()"
  """

  def run do
    # Start a PGLite instance
    {:ok, manager} = Pglite.start_link()

    # Get connection options and start Postgrex connection
    conn_opts = Pglite.get_connection_opts(manager)
    {:ok, conn} = Postgrex.start_link(conn_opts)

    IO.puts("🚀 Started PGLite database instance")

    # Create a table
    {:ok, _} = Postgrex.query(conn, """
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    """, [])

    IO.puts("✅ Created users table")

    # Insert some sample data
    {:ok, _} = Postgrex.query(conn, """
      INSERT INTO users (username, email) VALUES
        ('alice', 'alice@example.com'),
        ('bob', 'bob@example.com'),
        ('charlie', 'charlie@example.com')
    """, [])

    IO.puts("✅ Inserted sample users")

    # Query all users
    {:ok, result} = Postgrex.query(conn, "SELECT * FROM users ORDER BY id", [])
    IO.puts("\n📋 All users:")
    Enum.each(result.rows, fn [id, username, email, created_at] ->
      IO.puts("  #{id}: #{username} (#{email}) - #{created_at}")
    end)

    # Query with parameters
    {:ok, result} = Postgrex.query(conn, "SELECT * FROM users WHERE username = $1", ["alice"])
    IO.puts("\n🔍 User with username 'alice':")
    case result.rows do
      [[id, username, email, created_at]] ->
        IO.puts("  #{id}: #{username} (#{email}) - #{created_at}")
      [] ->
        IO.puts("  No user found")
    end

    # Count users
    {:ok, result} = Postgrex.query(conn, "SELECT COUNT(*) as user_count FROM users", [])
    [user_count] = List.first(result.rows)
    IO.puts("\n📊 Total users: #{user_count}")

    # Update a user
    {:ok, _} = Postgrex.query(conn, "UPDATE users SET email = $1 WHERE username = $2", ["alice.updated@example.com", "alice"])
    IO.puts("✅ Updated Alice's email")

    # Verify the update
    {:ok, result} = Postgrex.query(conn, "SELECT email FROM users WHERE username = $1", ["alice"])
    [email] = List.first(result.rows)
    IO.puts("✅ Alice's new email: #{email}")

    # Delete a user
    {:ok, _} = Postgrex.query(conn, "DELETE FROM users WHERE username = $1", ["charlie"])
    IO.puts("✅ Deleted user 'charlie'")

    # Final count
    {:ok, result} = Postgrex.query(conn, "SELECT COUNT(*) as user_count FROM users", [])
    [user_count] = List.first(result.rows)
    IO.puts("📊 Final user count: #{user_count}")

    # Clean up
    GenServer.stop(conn)
    GenServer.stop(manager)
    IO.puts("\n🧹 Cleaned up PGLite instance")
  end
end
