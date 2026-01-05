# Multiple Databases

Running multiple PGlite instances on different TCP ports.

## When to Use

Use this when you need completely separate PGlite instances. Each instance runs its own PostgreSQL process.

For multiple databases within a single instance, see `single_instance_multiple_dbs`.

## How It Works

Each instance needs a unique `tcp_port`:

```elixir
{:ok, db1} = Pglite.start_link(tcp_port: 54321)
{:ok, db2} = Pglite.start_link(tcp_port: 54322)
```

## Running

```bash
mix deps.get
mix run -e "MultipleDatabases.run()"
```
