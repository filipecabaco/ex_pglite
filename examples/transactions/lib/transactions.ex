defmodule Transactions do
  @moduledoc """
  Transaction handling with PGlite.

  Run with: mix run -e "Transactions.run()"
  """

  def run do
    {:ok, pglite} = Pglite.start_link()
    {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

    IO.puts("Started PGlite instance")

    {:ok, _} =
      Postgrex.query(
        conn,
        """
        CREATE TABLE accounts (
          id SERIAL PRIMARY KEY,
          account_number VARCHAR(20) UNIQUE NOT NULL,
          owner_name VARCHAR(100) NOT NULL,
          balance DECIMAL(10,2) DEFAULT 0.00
        )
        """,
        []
      )

    {:ok, _} =
      Postgrex.query(
        conn,
        """
        INSERT INTO accounts (account_number, owner_name, balance) VALUES
          ('ACC001', 'Alice', 1000.00),
          ('ACC002', 'Bob', 500.00)
        """,
        []
      )

    IO.puts("Created accounts table with initial data")

    print_balances(conn, "Initial balances")

    # Successful transaction
    IO.puts("\nExecuting transfer transaction...")

    result =
      Postgrex.transaction(conn, fn conn ->
        {:ok, _} =
          Postgrex.query(
            conn,
            "UPDATE accounts SET balance = balance - $1 WHERE account_number = $2",
            [Decimal.new("200.00"), "ACC001"]
          )

        {:ok, _} =
          Postgrex.query(
            conn,
            "UPDATE accounts SET balance = balance + $1 WHERE account_number = $2",
            [Decimal.new("200.00"), "ACC002"]
          )

        "Transfer completed"
      end)

    case result do
      {:ok, message} -> IO.puts(message)
      {:error, reason} -> IO.puts("Transaction failed: #{inspect(reason)}")
    end

    print_balances(conn, "After transfer")

    # Failed transaction (rollback using DBConnection.rollback)
    IO.puts("\nAttempting transaction that will fail (using rollback)...")

    result =
      Postgrex.transaction(conn, fn conn ->
        {:ok, _} =
          Postgrex.query(
            conn,
            "UPDATE accounts SET balance = balance - $1 WHERE account_number = $2",
            [Decimal.new("100.00"), "ACC001"]
          )

        DBConnection.rollback(conn, :simulated_error)
      end)

    case result do
      {:ok, _} -> IO.puts("Unexpected success")
      {:error, :simulated_error} -> IO.puts("Transaction rolled back as expected")
      {:error, reason} -> IO.puts("Transaction failed: #{inspect(reason)}")
    end

    # Also demonstrate exception handling in transactions
    IO.puts("\nAttempting transaction with exception...")

    result =
      try do
        Postgrex.transaction(conn, fn conn ->
          {:ok, _} =
            Postgrex.query(
              conn,
              "UPDATE accounts SET balance = balance - $1 WHERE account_number = $2",
              [Decimal.new("50.00"), "ACC001"]
            )

          raise "Simulated exception"
        end)
      rescue
        e in RuntimeError ->
          {:error, {:exception, e.message}}
      end

    case result do
      {:ok, _} -> IO.puts("Unexpected success")
      {:error, {:exception, msg}} -> IO.puts("Transaction rolled back after exception: #{msg}")
    end

    print_balances(conn, "After rollback (unchanged)")

    GenServer.stop(conn)
    GenServer.stop(pglite)
    IO.puts("\nCleaned up")
  end

  defp print_balances(conn, label) do
    {:ok, result} =
      Postgrex.query(
        conn,
        "SELECT account_number, owner_name, balance FROM accounts ORDER BY id",
        []
      )

    IO.puts("\n#{label}:")

    Enum.each(result.rows, fn [acc, owner, balance] ->
      IO.puts("  #{acc} (#{owner}): $#{balance}")
    end)
  end
end
