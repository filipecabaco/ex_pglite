defmodule Pglite do
  @moduledoc """
  High-level API for PGLite database operations using Bun and Erlang ports.

  This module provides a simple interface for working with PGLite databases,
  handling the underlying port communication with Bun processes.

  ## Example

      # Start a PGLite instance
      {:ok, pid} = Pglite.start_link()

      # Execute queries
      {:ok, result} = Pglite.query(pid, "SELECT 1 as test")

      # Execute with parameters
      {:ok, result} = Pglite.query(pid, "SELECT * FROM users WHERE id = $1", [123])

      # Execute DDL/DML statements
      {:ok, result} = Pglite.exec(pid, "CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT)")

      # Execute transactions
      queries = [
        %{sql: "INSERT INTO users (name) VALUES ($1)", params: ["Alice"]},
        %{sql: "INSERT INTO users (name) VALUES ($1)", params: ["Bob"]}
      ]
      {:ok, results} = Pglite.transaction(pid, queries)
  """

  alias Pglite.Runner.BunSocket

  @type connection :: pid()
  @type sql :: String.t()
  @type params :: list()
  @type query_result :: map()
  @type transaction_query :: %{sql: sql(), params: params()}

  @doc """
  Start a new PGLite instance.

  ## Options

  - `:data_dir` - Directory to store database files. Defaults to a random directory in the current folder.
  - `:name` - Optional name for the GenServer process.

  ## Examples

      # Database with random directory
      {:ok, pid} = Pglite.start_link()

      # Persistent database
      {:ok, pid} = Pglite.start_link(data_dir: "/tmp/my_db")

      # Named process
      {:ok, pid} = Pglite.start_link(name: MyDatabase)
  """
  @spec start_link(keyword()) :: {:ok, connection()} | {:error, term()}
  def start_link(opts \\ []) do
    # Database is now initialized automatically during BunSocket startup
    BunSocket.start_link(opts)
  end

  @doc """
  Execute a SQL query that returns results.

  Use this for SELECT statements and other queries that return data.

  ## Examples

      {:ok, result} = Pglite.query(pid, "SELECT * FROM users")
      {:ok, result} = Pglite.query(pid, "SELECT * FROM users WHERE id = $1", [123])
  """
  @spec query(connection(), sql(), params()) :: {:ok, query_result()} | {:error, term()}
  def query(connection, sql, params \\ []) do
    BunSocket.query(connection, sql, params)
  end

  @doc """
  Execute a SQL statement that doesn't return results.

  Use this for DDL statements (CREATE, ALTER, DROP) and DML statements
  (INSERT, UPDATE, DELETE) when you don't need the returned data.

  ## Examples

      {:ok, result} = Pglite.exec(pid, "CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT)")
      {:ok, result} = Pglite.exec(pid, "INSERT INTO users (name) VALUES ($1)", ["Alice"])
  """
  @spec exec(connection(), sql(), params()) :: {:ok, query_result()} | {:error, term()}
  def exec(connection, sql, params \\ []) do
    BunSocket.exec(connection, sql, params)
  end

  @doc """
  Execute multiple queries in a transaction.

  All queries will be executed within a single transaction. If any query fails,
  the entire transaction will be rolled back.

  ## Examples

      queries = [
        %{sql: "INSERT INTO users (name) VALUES ($1)", params: ["Alice"]},
        %{sql: "INSERT INTO users (name) VALUES ($1)", params: ["Bob"]},
        %{sql: "UPDATE users SET active = true WHERE name = $1", params: ["Alice"]}
      ]
      {:ok, results} = Pglite.transaction(pid, queries)
  """
  @spec transaction(connection(), [transaction_query()]) ::
          {:ok, [query_result()]} | {:error, term()}
  def transaction(connection, queries) do
    BunSocket.transaction(connection, queries)
  end

  @doc """
  Check if the PGLite instance is healthy and responsive.

  ## Examples

      {:ok, :healthy} = Pglite.health_check(pid)
      {:error, reason} = Pglite.health_check(pid)
  """
  @spec health_check(connection()) :: {:ok, :healthy} | {:error, term()}
  def health_check(connection) do
    BunSocket.health_check(connection)
  end

  @doc """
  Stop a PGLite instance gracefully.

  This will close the database connection and terminate the Bun process.

  ## Examples

      :ok = Pglite.stop(pid)
  """
  @spec stop(connection()) :: :ok
  def stop(connection) do
    GenServer.stop(connection)
  end
end
