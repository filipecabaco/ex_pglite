# Single Instance Multiple Schemas

Using PostgreSQL schemas within a single PGlite instance for logical data separation.

## Important Note

PGlite is single-user and doesn't support multiple databases. While `CREATE DATABASE` appears to succeed, the created databases are not functional. This example uses **schemas** instead of databases to achieve logical separation.

For truly separate instances (e.g., different configurations), use the `multiple_databases` example with different `tcp_port` values.

## How It Works

```elixir
# Start one PGlite instance
{:ok, pglite} = Pglite.start_link()
opts = Pglite.get_connection_opts(pglite) |> Keyword.put(:pool_size, 1)

# Connect and create schemas
{:ok, conn} = Postgrex.start_link(opts)
Postgrex.query(conn, "CREATE SCHEMA IF NOT EXISTS ecommerce", [])
Postgrex.query(conn, "CREATE SCHEMA IF NOT EXISTS analytics", [])

# Use schema-qualified table names
Postgrex.query(conn, "CREATE TABLE ecommerce.products (...)", [])
Postgrex.query(conn, "CREATE TABLE analytics.page_views (...)", [])
```

## Running

```bash
mix deps.get
mix run -e "SingleInstanceMultipleDbs.run()"
```






