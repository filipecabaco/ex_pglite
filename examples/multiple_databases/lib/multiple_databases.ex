defmodule MultipleDatabases do
  @moduledoc """
  Multiple Databases Example

  This example demonstrates running multiple PGLite instances simultaneously
  for different business domains (e-commerce, inventory, and analytics).
  
  Run with: mix run --no-halt -e "MultipleDatabases.run()"
  """

  def run do
    # Start three separate PGLite instances for different domains
    {:ok, ecommerce_manager} = Pglite.start_link(data_dir: "tmp/ecommerce_db", memory: false)
    {:ok, inventory_manager} = Pglite.start_link(data_dir: "tmp/inventory_db", memory: false)
    {:ok, analytics_manager} = Pglite.start_link(data_dir: "tmp/analytics_db", memory: false)

    IO.puts("🚀 Started three PGLite database instances:")
    IO.puts("  📦 E-commerce database")
    IO.puts("  📋 Inventory database")
    IO.puts("  📊 Analytics database")

    # Get connection options and start Postgrex connections
    ecommerce_opts = Pglite.get_connection_opts(ecommerce_manager)
    inventory_opts = Pglite.get_connection_opts(inventory_manager)
    analytics_opts = Pglite.get_connection_opts(analytics_manager)

    {:ok, ecommerce_conn} = Postgrex.start_link(ecommerce_opts)
    {:ok, inventory_conn} = Postgrex.start_link(inventory_opts)
    {:ok, analytics_conn} = Postgrex.start_link(analytics_opts)

    # Set up schemas and demo data
    setup_ecommerce_db(ecommerce_conn)
    setup_inventory_db(inventory_conn)
    setup_analytics_db(analytics_conn)

    # Demonstrate cross-database operations
    demo_cross_database_operations(ecommerce_conn, inventory_conn, analytics_conn)

    # Clean up all databases
    IO.puts("\n🧹 Cleaning up all database instances...")
    GenServer.stop(ecommerce_conn)
    GenServer.stop(inventory_conn)
    GenServer.stop(analytics_conn)
    GenServer.stop(ecommerce_manager)
    GenServer.stop(inventory_manager)
    GenServer.stop(analytics_manager)
    IO.puts("✅ All databases cleaned up")
  end

  defp setup_ecommerce_db(conn) do
    # Set up E-commerce database schema
    {:ok, _} = Postgrex.query(conn, """
      CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        customer_id VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        registration_date DATE DEFAULT CURRENT_DATE
      )
    """, [])

    {:ok, _} = Postgrex.query(conn, """
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(20) UNIQUE NOT NULL,
        customer_id VARCHAR(20) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending'
      )
    """, [])

    {:ok, _} = Postgrex.query(conn, """
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(20) NOT NULL,
        product_sku VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL
      )
    """, [])

    # Insert sample data
    {:ok, _} = Postgrex.query(conn, """
      INSERT INTO customers (customer_id, name, email) VALUES
        ('CUST001', 'Alice Johnson', 'alice@example.com'),
        ('CUST002', 'Bob Smith', 'bob@example.com')
    """, [])

    {:ok, _} = Postgrex.query(conn, """
      INSERT INTO orders (order_id, customer_id, total_amount, status) VALUES
        ('ORD001', 'CUST001', 299.99, 'completed'),
        ('ORD002', 'CUST002', 149.50, 'completed')
    """, [])

    {:ok, _} = Postgrex.query(conn, """
      INSERT INTO order_items (order_id, product_sku, quantity, unit_price) VALUES
        ('ORD001', 'LAPTOP001', 1, 299.99),
        ('ORD002', 'MOUSE001', 2, 74.75)
    """, [])

    IO.puts("✅ Created e-commerce schema and data")
  end

  defp setup_inventory_db(conn) do
    # Set up Inventory database schema
    {:ok, _} = Postgrex.query(conn, """
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100) NOT NULL,
        cost_price DECIMAL(10,2) NOT NULL,
        retail_price DECIMAL(10,2) NOT NULL
      )
    """, [])

    {:ok, _} = Postgrex.query(conn, """
      CREATE TABLE stock_levels (
        id SERIAL PRIMARY KEY,
        product_sku VARCHAR(50) NOT NULL,
        warehouse VARCHAR(50) NOT NULL,
        quantity INTEGER NOT NULL
      )
    """, [])

    # Insert sample data
    {:ok, _} = Postgrex.query(conn, """
      INSERT INTO products (sku, name, category, cost_price, retail_price) VALUES
        ('LAPTOP001', 'Gaming Laptop Pro', 'Electronics', 200.00, 299.99),
        ('MOUSE001', 'Wireless Gaming Mouse', 'Accessories', 50.00, 74.75)
    """, [])

    {:ok, _} = Postgrex.query(conn, """
      INSERT INTO stock_levels (product_sku, warehouse, quantity) VALUES
        ('LAPTOP001', 'Main', 15),
        ('MOUSE001', 'Main', 50)
    """, [])

    IO.puts("✅ Created inventory schema and data")
  end

  defp setup_analytics_db(conn) do
    # Set up Analytics database schema
    {:ok, _} = Postgrex.query(conn, """
      CREATE TABLE sales_analytics (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        product_sku VARCHAR(50) NOT NULL,
        total_sales DECIMAL(10,2) NOT NULL,
        units_sold INTEGER NOT NULL,
        customer_count INTEGER NOT NULL
      )
    """, [])

    IO.puts("✅ Created analytics schema")
  end

  defp demo_cross_database_operations(ecommerce_conn, inventory_conn, analytics_conn) do
    IO.puts("\n🔄 Demonstrating cross-database operations...")

    # Get order data from e-commerce
    {:ok, order_result} = Postgrex.query(ecommerce_conn, """
      SELECT o.order_id, o.total_amount, o.order_date,
             oi.product_sku, oi.quantity, oi.unit_price
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.status = 'completed'
    """, [])

    # Get product details from inventory
    {:ok, product_result} = Postgrex.query(inventory_conn, """
      SELECT sku, name, cost_price, retail_price
      FROM products
    """, [])

    # Create a products lookup map
    products_map = Enum.reduce(product_result.rows, %{}, fn [sku, name, cost_price, retail_price], acc ->
      Map.put(acc, sku, %{name: name, cost_price: cost_price, retail_price: retail_price})
    end)

    IO.puts("  📈 Calculating profit margins...")

    # Process orders and create analytics
    Enum.each(order_result.rows, fn [order_id, _total_amount, order_date, product_sku, quantity, unit_price] ->
      case Map.get(products_map, product_sku) do
        %{name: name, cost_price: cost_price} ->
          profit_per_unit = Decimal.sub(unit_price, cost_price)
          total_profit = Decimal.mult(profit_per_unit, quantity)

          IO.puts("    Order #{order_id}: #{name} - Profit: $#{profit_per_unit}/unit, Total: $#{total_profit}")

          # Insert analytics data
          {:ok, _} = Postgrex.query(analytics_conn, """
            INSERT INTO sales_analytics (date, product_sku, total_sales, units_sold, customer_count)
            VALUES ($1, $2, $3, $4, 1)
          """, [Date.new!(order_date.year, order_date.month, order_date.day), 
                product_sku, Decimal.mult(unit_price, quantity), quantity])

        nil ->
          IO.puts("    Order #{order_id}: Product #{product_sku} not found in inventory")
      end
    end)

    # Generate business intelligence summary
    generate_business_summary(ecommerce_conn, analytics_conn, products_map)
  end

  defp generate_business_summary(ecommerce_conn, analytics_conn, products_map) do
    IO.puts("\n🎯 Business Intelligence Summary:")

    # Total revenue
    {:ok, revenue_result} = Postgrex.query(ecommerce_conn, """
      SELECT SUM(total_amount) as total_revenue
      FROM orders
      WHERE status = 'completed'
    """, [])
    
    [total_revenue] = List.first(revenue_result.rows)
    IO.puts("  💰 Total Revenue: $#{total_revenue}")

    # Top performing product
    {:ok, top_product} = Postgrex.query(analytics_conn, """
      SELECT product_sku, SUM(units_sold) as total_sold, SUM(total_sales) as total_revenue
      FROM sales_analytics
      GROUP BY product_sku
      ORDER BY total_revenue DESC
      LIMIT 1
    """, [])

    case top_product.rows do
      [[sku, units_sold, revenue]] ->
        product_name = Map.get(products_map, sku, %{name: "Unknown"}).name
        IO.puts("  🏆 Top Product: #{product_name} (#{sku}) - #{units_sold} units, $#{revenue} revenue")
      [] ->
        IO.puts("  🏆 No sales data available")
    end

    # Customer count
    {:ok, customer_count} = Postgrex.query(ecommerce_conn, "SELECT COUNT(*) FROM customers", [])
    [count] = List.first(customer_count.rows)
    IO.puts("  👥 Total Customers: #{count}")
  end
end
