# PGLite

A lightweight Elixir library that provides PostgreSQL functionality through PGLite, a WebAssembly-based PostgreSQL implementation. This library offers a simple and efficient way to run PostgreSQL databases in your Elixir applications without requiring a full PostgreSQL server installation.

## Features

- **Lightweight**: No need for a full PostgreSQL server installation
- **WebAssembly-based**: Runs PGLite in a Bun runtime environment
- **Socket-based communication**: Uses Unix domain sockets for efficient local communication
- **Postgrex integration**: Seamlessly integrates with the popular Postgrex library
- **Multiple instances**: Support for running multiple database instances simultaneously
- **Memory and file-based storage**: Choose between in-memory or persistent file storage
- **Transaction support**: Full ACID transaction capabilities
- **Cross-platform**: Works on macOS, Linux, and Windows (with WSL)

## Prerequisites

- **Bun**: A fast JavaScript runtime that executes the PGLite WebAssembly code
- **Elixir**: Version 1.18 or later

### Installing Bun

```bash
# macOS and Linux
curl -fsSL https://bun.sh/install | bash

# Windows (with WSL)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

## Installation

Add `pglite` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:pglite, "~> 0.1.0"}
  ]
end
```

Then install your dependencies:

```bash
mix deps.get
```

## Quick Start

### Basic Usage

```elixir
# Start a PGLite instance
{:ok, manager} = Pglite.start_link()

# Get connection options for Postgrex
opts = Pglite.get_connection_opts(manager)

# Connect with Postgrex
{:ok, conn} = Postgrex.start_link(opts)

# Execute queries
{:ok, result} = Postgrex.query(conn, "SELECT 1 as test", [])
IO.inspect(result.rows) # [[1]]

# Clean up
GenServer.stop(conn)
GenServer.stop(manager)
```

### With Custom Configuration

```elixir
{:ok, manager} = Pglite.start_link(
  database: "myapp",
  username: "user",
  password: "password",
  data_dir: "tmp/myapp_data",
  timeout: 10_000
)
```

### Multiple Instances

```elixir
# Start multiple instances with different data directories
{:ok, manager1} = Pglite.start_link(data_dir: "tmp/app1_data")
{:ok, manager2} = Pglite.start_link(data_dir: "tmp/app2_data")

# Each instance operates independently
opts1 = Pglite.get_connection_opts(manager1)
opts2 = Pglite.get_connection_opts(manager2)

{:ok, conn1} = Postgrex.start_link(opts1)
{:ok, conn2} = Postgrex.start_link(opts2)
```

## Architecture

PGLite uses a client-server architecture where:

1. **Elixir Process**: Manages the PGLite lifecycle and provides connection options
2. **Bun Runtime**: Executes the PGLite WebAssembly code
3. **Socket Communication**: Uses Unix domain sockets for efficient local communication
4. **Postgrex Integration**: Standard PostgreSQL client library for database operations

### How It Works

1. When you start a PGLite instance, it spawns a Bun process running the PGLite socket server
2. The socket server creates a Unix domain socket in a temporary directory
3. Connection options are returned that include the socket path
4. Postgrex connects to the socket using standard PostgreSQL protocol
5. All database operations go through the socket to the PGLite WebAssembly instance

## Configuration Options

### PGLite Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `database` | `String` | `"postgres"` | Database name |
| `username` | `String` | `"postgres"` | Username for authentication |
| `password` | `String` | `"password"` | Password for authentication |
| `data_dir` | `String` | `"tmp/<random>"` | Directory for database files |
| `memory` | `boolean` | `true` | Use in-memory storage when true |
| `timeout` | `integer` | `5000` | Startup timeout in milliseconds |
| `bun_executable` | `String` | `"bun"` | Path to Bun executable |

### Connection Options

The `get_connection_opts/1` function returns a keyword list compatible with Postgrex:

```elixir
[
  host: "localhost",
  port: 5432,
  database: "postgres",
  username: "postgres",
  password: "password",
  socket_dir: "/tmp/pglite_sockets_12345"
]
```

## Database Operations

### Basic Queries

```elixir
# Simple SELECT
{:ok, result} = Postgrex.query(conn, "SELECT 1 as test", [])

# Parameterized queries
{:ok, result} = Postgrex.query(conn, "SELECT $1::text as name", ["Alice"])

# DDL statements
{:ok, _} = Postgrex.query(conn, "CREATE TABLE users (id SERIAL, name TEXT)", [])

# DML statements
{:ok, _} = Postgrex.query(conn, "INSERT INTO users (name) VALUES ($1)", ["Bob"])
```

### Transactions

```elixir
Postgrex.transaction(conn, fn conn ->
  {:ok, _} = Postgrex.query(conn, "INSERT INTO users (name) VALUES ($1)", ["Alice"])
  {:ok, _} = Postgrex.query(conn, "INSERT INTO users (name) VALUES ($1)", ["Bob"])
  {:ok, result} = Postgrex.query(conn, "SELECT COUNT(*) FROM users", [])
  result
end)
```

### Connection Pooling

```elixir
# With connection pooling
{:ok, conn} = Postgrex.start_link(opts ++ [pool_size: 10])

# Or use a connection pool library like Poolboy
```

## Storage Options

### In-Memory Storage

```elixir
# Default behavior - data is stored in memory
{:ok, manager} = Pglite.start_link()

# Explicit in-memory storage
{:ok, manager} = Pglite.start_link(memory: true)
```

### File-Based Storage

```elixir
# Persistent file storage
{:ok, manager} = Pglite.start_link(
  memory: false,
  data_dir: "data/myapp"
)
```

### Memory Prefix

When using in-memory storage, the data directory is automatically prefixed with `memory://`:

```elixir
# This becomes "memory://tmp/abc123"
{:ok, manager} = Pglite.start_link(data_dir: "tmp/abc123", memory: true)
```

## Error Handling

PGLite provides robust error handling:

```elixir
case Pglite.start_link() do
  {:ok, manager} ->
    # Success - proceed with database operations
    opts = Pglite.get_connection_opts(manager)
    {:ok, conn} = Postgrex.start_link(opts)

  {:error, :bun_not_found} ->
    Logger.error("Bun runtime not found. Please install Bun.")

  {:error, :startup_timeout} ->
    Logger.error("PGLite startup timed out")

  {:error, reason} ->
    Logger.error("Failed to start PGLite: #{inspect(reason)}")
end
```

## Health Checks

You can perform health checks on your PGLite instances:

```elixir
# Basic health check
case Pglite.health_check(manager) do
  :ok ->
    Logger.info("PGLite is healthy")
  {:error, reason} ->
    Logger.error("PGLite health check failed: #{inspect(reason)}")
end
```

## Testing

PGLite is excellent for testing scenarios:

```elixir
defmodule MyAppTest do
  use ExUnit.Case

  setup do
    {:ok, manager} = Pglite.start_link()
    opts = Pglite.get_connection_opts(manager)
    {:ok, conn} = Postgrex.start_link(opts)

    on_exit(fn ->
      GenServer.stop(conn)
      GenServer.stop(manager)
    end)

    %{conn: conn, manager: manager}
  end

  test "can create and query tables", %{conn: conn} do
    {:ok, _} = Postgrex.query(conn, "CREATE TABLE test (id INTEGER)", [])
    {:ok, _} = Postgrex.query(conn, "INSERT INTO test VALUES (1)", [])
    {:ok, result} = Postgrex.query(conn, "SELECT * FROM test", [])
    assert result.rows == [[1]]
  end
end
```

## Performance Considerations

- **Startup Time**: First startup includes WebAssembly compilation (~1-2 seconds)
- **Memory Usage**: In-memory storage is faster but uses more RAM
- **Concurrent Connections**: Multiple connections to the same instance share the same database
- **Socket Performance**: Unix domain sockets provide excellent local performance

## Troubleshooting

### Common Issues

1. **Bun not found**: Ensure Bun is installed and in your PATH
2. **Permission errors**: Check that the temporary directory is writable
3. **Port conflicts**: Each instance uses unique socket paths automatically
4. **Startup timeouts**: Increase the timeout option for slower systems

### Debug Mode

Enable debug logging to see detailed startup information:

```elixir
# In your config
config :logger, level: :debug
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [PGLite](https://github.com/electric-sql/pglite) - The WebAssembly-based PostgreSQL implementation
- [Postgrex](https://github.com/elixir-ecto/postgrex) - The PostgreSQL driver for Elixir
- [Bun](https://bun.sh/) - The fast JavaScript runtime

## Changelog

### 0.1.0
- Initial release
- Socket-based communication architecture
- Postgrex integration
- Support for multiple instances
- Memory and file-based storage options