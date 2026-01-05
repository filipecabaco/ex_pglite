defmodule MultipleDatabases do
  @moduledoc """
  Running multiple PGlite instances on different TCP ports.

  Run with: mix run -e "MultipleDatabases.run()"
  """

  def run do
    {:ok, ecommerce} = Pglite.start_link(tcp_port: 54321)
    {:ok, inventory} = Pglite.start_link(tcp_port: 54322)
    {:ok, analytics} = Pglite.start_link(tcp_port: 54323)

    IO.puts("Started three PGlite instances on ports 54321, 54322, 54323")

    {:ok, ecommerce_conn} = Postgrex.start_link(Pglite.get_connection_opts(ecommerce))
    {:ok, inventory_conn} = Postgrex.start_link(Pglite.get_connection_opts(inventory))
    {:ok, analytics_conn} = Postgrex.start_link(Pglite.get_connection_opts(analytics))

    setup_ecommerce(ecommerce_conn)
    setup_inventory(inventory_conn)
    setup_analytics(analytics_conn)

    cross_database_query(ecommerce_conn, inventory_conn, analytics_conn)

    IO.puts("\nCleaning up...")
    GenServer.stop(ecommerce_conn)
    GenServer.stop(inventory_conn)
    GenServer.stop(analytics_conn)
    GenServer.stop(ecommerce)
    GenServer.stop(inventory)
    GenServer.stop(analytics)
    IO.puts("Done")
  end

  defp setup_ecommerce(conn) do
    {:ok, _} =
      Postgrex.query(
        conn,
        """
        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          order_id VARCHAR(20) UNIQUE NOT NULL,
          product_sku VARCHAR(50) NOT NULL,
          quantity INTEGER NOT NULL,
          total DECIMAL(10,2) NOT NULL
        )
        """,
        []
      )

    {:ok, _} =
      Postgrex.query(
        conn,
        """
        INSERT INTO orders (order_id, product_sku, quantity, total) VALUES
          ('ORD001', 'LAPTOP001', 1, 299.99),
          ('ORD002', 'MOUSE001', 2, 149.50)
        """,
        []
      )

    IO.puts("Created ecommerce schema")
  end

  defp setup_inventory(conn) do
    {:ok, _} =
      Postgrex.query(
        conn,
        """
        CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          sku VARCHAR(50) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          cost DECIMAL(10,2) NOT NULL,
          price DECIMAL(10,2) NOT NULL
        )
        """,
        []
      )

    {:ok, _} =
      Postgrex.query(
        conn,
        """
        INSERT INTO products (sku, name, cost, price) VALUES
          ('LAPTOP001', 'Gaming Laptop', 200.00, 299.99),
          ('MOUSE001', 'Wireless Mouse', 50.00, 74.75)
        """,
        []
      )

    IO.puts("Created inventory schema")
  end

  defp setup_analytics(conn) do
    {:ok, _} =
      Postgrex.query(
        conn,
        """
        CREATE TABLE sales (
          id SERIAL PRIMARY KEY,
          product_sku VARCHAR(50) NOT NULL,
          revenue DECIMAL(10,2) NOT NULL,
          profit DECIMAL(10,2) NOT NULL
        )
        """,
        []
      )

    IO.puts("Created analytics schema")
  end

  defp cross_database_query(ecommerce_conn, inventory_conn, analytics_conn) do
    IO.puts("\nCross-database aggregation:")

    {:ok, orders} =
      Postgrex.query(ecommerce_conn, "SELECT product_sku, quantity, total FROM orders", [])

    {:ok, products} = Postgrex.query(inventory_conn, "SELECT sku, name, cost FROM products", [])

    products_map =
      Enum.reduce(products.rows, %{}, fn [sku, name, cost], acc ->
        Map.put(acc, sku, %{name: name, cost: cost})
      end)

    Enum.each(orders.rows, fn [sku, quantity, total] ->
      case Map.get(products_map, sku) do
        %{name: name, cost: cost} ->
          profit = Decimal.sub(total, Decimal.mult(cost, quantity))
          IO.puts("  #{name}: revenue $#{total}, profit $#{profit}")

          {:ok, _} =
            Postgrex.query(
              analytics_conn,
              "INSERT INTO sales (product_sku, revenue, profit) VALUES ($1, $2, $3)",
              [sku, total, profit]
            )

        nil ->
          IO.puts("  Unknown product: #{sku}")
      end
    end)

    {:ok, totals} =
      Postgrex.query(analytics_conn, "SELECT SUM(revenue), SUM(profit) FROM sales", [])

    [[revenue, profit]] = totals.rows
    IO.puts("\nTotals: revenue $#{revenue}, profit $#{profit}")
  end
end
