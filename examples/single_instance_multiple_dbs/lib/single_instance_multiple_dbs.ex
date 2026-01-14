defmodule SingleInstanceMultipleDbs do
  @moduledoc """
  Using multiple PostgreSQL schemas within a single PGlite instance for logical separation.

  PGlite is single-user and doesn't support multiple databases. This example demonstrates
  using PostgreSQL schemas to achieve logical separation of data within a single database.

  Run with: mix run -e "SingleInstanceMultipleDbs.run()"
  """

  def run do
    IO.puts("Starting PGlite with multiple schemas\n")

    {:ok, pglite} = Pglite.start_link()
    opts = Pglite.get_connection_opts(pglite) |> Keyword.put(:pool_size, 1)

    {:ok, conn} = Postgrex.start_link(opts)
    IO.puts("Connected to PGlite")

    {:ok, _} = Postgrex.query(conn, "CREATE SCHEMA IF NOT EXISTS ecommerce", [])
    {:ok, _} = Postgrex.query(conn, "CREATE SCHEMA IF NOT EXISTS analytics", [])
    {:ok, _} = Postgrex.query(conn, "CREATE SCHEMA IF NOT EXISTS cache", [])
    IO.puts("Created schemas: ecommerce, analytics, cache\n")

    setup_ecommerce(conn)
    setup_analytics(conn)
    setup_cache(conn)

    demonstrate_isolation(conn)

    IO.puts("\nCleaning up...")
    GenServer.stop(conn)
    GenServer.stop(pglite)
    IO.puts("Done")
  end

  defp setup_ecommerce(conn) do
    {:ok, _} =
      Postgrex.query(
        conn,
        """
        CREATE TABLE ecommerce.products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          price DECIMAL(10,2) NOT NULL
        )
        """,
        []
      )

    {:ok, _} =
      Postgrex.query(
        conn,
        """
        INSERT INTO ecommerce.products (name, price) VALUES
          ('Laptop', 1299.99),
          ('Mouse', 49.99)
        """,
        []
      )

    IO.puts("Created ecommerce schema with products table")
  end

  defp setup_analytics(conn) do
    {:ok, _} =
      Postgrex.query(
        conn,
        """
        CREATE TABLE analytics.page_views (
          id SERIAL PRIMARY KEY,
          page VARCHAR(200) NOT NULL,
          viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        []
      )

    {:ok, _} =
      Postgrex.query(
        conn,
        """
        INSERT INTO analytics.page_views (page) VALUES
          ('/home'),
          ('/products'),
          ('/checkout')
        """,
        []
      )

    IO.puts("Created analytics schema with page_views table")
  end

  defp setup_cache(conn) do
    {:ok, _} =
      Postgrex.query(
        conn,
        """
        CREATE TABLE cache.entries (
          key VARCHAR(200) PRIMARY KEY,
          value TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL
        )
        """,
        []
      )

    {:ok, _} =
      Postgrex.query(
        conn,
        """
        INSERT INTO cache.entries (key, value, expires_at) VALUES
          ('session:1', 'abc123', NOW() + INTERVAL '1 hour'),
          ('featured', '1,2,3', NOW() + INTERVAL '5 minutes')
        """,
        []
      )

    IO.puts("Created cache schema with entries table")
  end

  defp demonstrate_isolation(conn) do
    IO.puts("\nDemonstrating schema isolation:")

    {:ok, result} = Postgrex.query(conn, "SELECT COUNT(*) FROM ecommerce.products", [])
    [[count]] = result.rows
    IO.puts("  ecommerce.products: #{count} products")

    {:ok, result} = Postgrex.query(conn, "SELECT COUNT(*) FROM analytics.page_views", [])
    [[count]] = result.rows
    IO.puts("  analytics.page_views: #{count} page views")

    {:ok, result} = Postgrex.query(conn, "SELECT COUNT(*) FROM cache.entries", [])
    [[count]] = result.rows
    IO.puts("  cache.entries: #{count} entries")

    # Verify isolation - products table doesn't exist in analytics schema
    case Postgrex.query(conn, "SELECT * FROM analytics.products", []) do
      {:error, %Postgrex.Error{postgres: %{code: :undefined_table}}} ->
        IO.puts("  Confirmed: 'products' table does not exist in analytics schema (isolation works)")

      {:error, _} ->
        IO.puts("  Confirmed: analytics.products query failed (isolation works)")

      {:ok, _} ->
        IO.puts("  ERROR: Tables leaking across schemas")
    end
  end
end






