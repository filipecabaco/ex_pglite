defmodule Transactions do
  @moduledoc """
  Transactions Example

  This example demonstrates transaction handling with PGLite.
  Run with: mix run --no-halt -e "Transactions.run()"
  """

  def run do
    # Start a PGLite instance
    {:ok, manager} = Pglite.start_link()

    # Get connection options and start Postgrex connection
    conn_opts = Pglite.get_connection_opts(manager)
    {:ok, conn} = Postgrex.start_link(conn_opts)

    IO.puts("🚀 Started PGLite database instance")

    # Create tables for a simple banking system
    {:ok, _} = Postgrex.query(conn, """
      CREATE TABLE accounts (
        id SERIAL PRIMARY KEY,
        account_number VARCHAR(20) UNIQUE NOT NULL,
        owner_name VARCHAR(100) NOT NULL,
        balance DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    """, [])

    IO.puts("✅ Created accounts table")

    # Insert some initial accounts
    {:ok, _} = Postgrex.query(conn, """
      INSERT INTO accounts (account_number, owner_name, balance) VALUES
        ('ACC001', 'Alice Johnson', 1000.00),
        ('ACC002', 'Bob Smith', 500.00)
    """, [])

    IO.puts("✅ Created initial accounts")

    # Display initial balances
    {:ok, result} = Postgrex.query(conn, "SELECT account_number, owner_name, balance FROM accounts ORDER BY id", [])
    IO.puts("\n💰 Initial account balances:")
    Enum.each(result.rows, fn [acc_num, owner, balance] ->
      IO.puts("  #{acc_num} (#{owner}): $#{balance}")
    end)

    # Example: Successful money transfer transaction
    IO.puts("\n🔄 Executing money transfer transaction...")

    result = Postgrex.transaction(conn, fn conn ->
      # Transfer $200 from Alice to Bob
      {:ok, _} = Postgrex.query(conn, "UPDATE accounts SET balance = balance - $1 WHERE account_number = $2", [200.00, "ACC001"])
      {:ok, _} = Postgrex.query(conn, "UPDATE accounts SET balance = balance + $1 WHERE account_number = $2", [200.00, "ACC002"])

      # Return success message
      "Transfer completed successfully"
    end)

    case result do
      {:ok, message} ->
        IO.puts("✅ #{message}")
      {:error, reason} ->
        IO.puts("❌ Transaction failed: #{inspect(reason)}")
    end

    # Display final balances
    {:ok, result} = Postgrex.query(conn, "SELECT account_number, owner_name, balance FROM accounts ORDER BY id", [])
    IO.puts("\n💰 Final account balances:")
    Enum.each(result.rows, fn [acc_num, owner, balance] ->
      IO.puts("  #{acc_num} (#{owner}): $#{balance}")
    end)

    # Example: Transaction rollback
    IO.puts("\n🔄 Attempting transaction with error (will rollback)...")

    result = Postgrex.transaction(conn, fn conn ->
      # Update Alice's balance
      {:ok, _} = Postgrex.query(conn, "UPDATE accounts SET balance = balance - $1 WHERE account_number = $2", [100.00, "ACC001"])
      
      # Simulate an error
      raise "Something went wrong!"
      
      # This won't be reached
      {:ok, _} = Postgrex.query(conn, "UPDATE accounts SET balance = balance + $1 WHERE account_number = $2", [100.00, "ACC002"])
    end)

    case result do
      {:ok, _} ->
        IO.puts("❌ Transaction should have failed but didn't")
      {:error, reason} ->
        IO.puts("✅ Transaction correctly rolled back: #{inspect(reason)}")
    end

    # Verify balances are unchanged after rollback
    {:ok, result} = Postgrex.query(conn, "SELECT account_number, owner_name, balance FROM accounts ORDER BY id", [])
    IO.puts("\n💰 Balances after rollback:")
    Enum.each(result.rows, fn [acc_num, owner, balance] ->
      IO.puts("  #{acc_num} (#{owner}): $#{balance}")
    end)

    # Clean up
    GenServer.stop(conn)
    GenServer.stop(manager)
    IO.puts("\n🧹 Cleaned up PGLite instance")
  end
end
