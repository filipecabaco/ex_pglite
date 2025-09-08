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

- Elixir 1.18 or later
- Bun runtime (`curl -fsSL https://bun.sh/install | bash`)

## Installation

Add `pglite` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:ex_pglite, "~> 0.1.0"}
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

### Configuration

```elixir
{:ok, manager} = Pglite.start_link(
  database: "myapp",
  username: "user",
  password: "password",
  data_dir: "tmp/myapp_data",
  memory: false,  # Use persistent storage
  startup_timeout: 5_000
)
```

## How It Works

1. PGLite spawns a Bun process running the PGLite WebAssembly code
2. Communication happens via Unix domain sockets
3. Postgrex connects using standard PostgreSQL protocol
4. All database operations are handled by the WebAssembly instance

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `database` | `String` | `"postgres"` | Database name |
| `username` | `String` | `"postgres"` | Username |
| `password` | `String` | `"password"` | Password |
| `data_dir` | `String` | `"tmp/<random>"` | Directory for database files |
| `memory` | `boolean` | `true` | Use in-memory storage |
| `initial_memory` | `integer` | `nil` | Initial memory size in bytes |
| `startup_timeout` | `integer` | `3000` | Startup timeout in milliseconds |
| `bun_executable` | `String` | `"bun"` | Path to Bun executable |

## Usage Examples

```elixir
# Basic queries
{:ok, result} = Postgrex.query(conn, "SELECT 1 as test", [])
{:ok, _} = Postgrex.query(conn, "CREATE TABLE users (id SERIAL, name TEXT)", [])
{:ok, _} = Postgrex.query(conn, "INSERT INTO users (name) VALUES ($1)", ["Alice"])

# Transactions
Postgrex.transaction(conn, fn conn ->
  {:ok, _} = Postgrex.query(conn, "INSERT INTO users (name) VALUES ($1)", ["Bob"])
  {:ok, result} = Postgrex.query(conn, "SELECT COUNT(*) FROM users", [])
  result
end)
```

## Storage Options

```elixir
# In-memory storage (default)
{:ok, manager} = Pglite.start_link(memory: true)

# Persistent file storage
{:ok, manager} = Pglite.start_link(memory: false, data_dir: "data/myapp")
```

## Error Handling and Health Checks

```elixir
# Error handling
case Pglite.start_link() do
  {:ok, manager} -> # proceed with operations
  {:error, :bun_not_found} -> # install Bun
  {:error, reason} -> # handle other errors
end

# Health checks
Pglite.health_check(manager)  # returns :ok or {:error, reason}
```

## Testing

```elixir
defmodule MyAppTest do
  use ExUnit.Case

  setup do
    {:ok, manager} = Pglite.start_link()
    opts = Pglite.get_connection_opts(manager)
    {:ok, conn} = Postgrex.start_link(opts)
    on_exit(fn -> GenServer.stop(conn); GenServer.stop(manager) end)
    %{conn: conn}
  end

  test "database operations", %{conn: conn} do
    {:ok, _} = Postgrex.query(conn, "CREATE TABLE test (id INTEGER)", [])
    {:ok, result} = Postgrex.query(conn, "SELECT 1", [])
    assert result.rows == [[1]]
  end
end
```

## Notes

- First startup takes 1-2 seconds for WebAssembly compilation
- In-memory storage is faster but uses more RAM
- Each instance uses unique socket paths to avoid conflicts
- Enable debug logging with `config :logger, level: :debug`

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
