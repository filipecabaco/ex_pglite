# PGLite

An Elixir library that provides a simple interface to [PGLite](https://github.com/electric-sql/pglite) using Bun runtime. PGLite is a lightweight PostgreSQL database that runs entirely in memory or with persistence, perfect for local development, testing, and applications that need an embedded PostgreSQL database.

## Features

- **Direct Postgrex Integration**: Returns standard Postgrex connection PIDs - use with any Postgrex function
- **Unix Domain Sockets**: High-performance IPC communication between Elixir and Bun processes
- **Process Isolation**: Each database runs in its own Bun process for better concurrency
- **Memory & Persistent Databases**: Support for both in-memory and file-based databases
- **Automatic Cleanup**: Proper resource management with automatic process and socket cleanup
- **Multiple Instances**: Run multiple concurrent PGLite databases simultaneously
- **Self-Contained**: Automatically builds and bundles JavaScript dependencies on first use
- **Zero External Setup**: No need to manually install or manage JavaScript dependencies
- **Production Ready**: Comprehensive test suite with robust error handling

## Architecture

PGLite uses a Unix domain socket architecture where each database connection runs in its own Bun process:

```
┌─────────────────┐    Unix Socket    ┌─────────────────┐    ┌─────────────────┐
│   Elixir App    │ ◄──────────────► │   Bun Process   │ ◄─► │     PGLite      │
│                 │                   │                 │    │   (Database)    │
│ Postgrex Client │                   │ Socket Server   │    │                 │
└─────────────────┘                   └─────────────────┘    └─────────────────┘
```

### Key Components

- **Bun Runtime**: Uses [Bun](https://bun.sh/) as the JavaScript runtime for executing PGLite
- **Unix Domain Sockets**: High-performance IPC communication between Elixir and Bun processes
- **Process Isolation**: Each database runs in its own isolated Bun process for better concurrency
- **Postgrex Integration**: Standard PostgreSQL wire protocol via Unix sockets
- **Automatic Resource Management**: Proper cleanup of processes and socket files

### How It Works

1. **Auto-Bundle** *(first run only)*: Automatically builds self-contained JavaScript bundle with PGLite dependencies
2. **Startup**: `Pglite.start_link/1` spawns a Bun process running the PGLite socket server
3. **Socket Creation**: Bun creates a Unix domain socket and initializes the PGLite database
4. **Connection**: Postgrex connects to the Unix socket using standard PostgreSQL protocol
5. **Database Operations**: Use standard Postgrex functions (`query/3`, `transaction/2`, etc.)
6. **Cleanup**: Automatic termination of Bun processes and socket cleanup on shutdown

## Usage

### Basic Usage

```elixir
{:ok, {manager, conn}} = Pglite.start_link()

{:ok, _} = Postgrex.query(conn, "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)", [])
{:ok, _} = Postgrex.query(conn, "INSERT INTO users (id, name) VALUES ($1, $2)", [0, "Alice"])
{:ok, result} = Postgrex.query(conn, "SELECT * FROM users", [])

:ok = GenServer.stop(manager)
```

### Database Types

```elixir

{:ok, {manager, conn}} = Pglite.start_link()
{:ok, {manager, conn}} = Pglite.start_link(memory: true)
{:ok, {manager, conn}} = Pglite.start_link(data_dir: "/tmp/my_database")
```

### Multiple Instances

```elixir
# Run multiple databases concurrently
{:ok, {manager1, conn1}} = Pglite.start_link(data_dir: "/tmp/db1")
{:ok, {manager2, conn2}} = Pglite.start_link(data_dir: "/tmp/db2")

# Each database is completely isolated
Postgrex.query(conn1, "CREATE TABLE users (id INTEGER, name TEXT)", [])
Postgrex.query(conn2, "CREATE TABLE orders (id INTEGER, user_id INTEGER)", [])

# Clean up
Pglite.stop(manager1)
Pglite.stop(manager2)
```

### Transactions

```elixir
{:ok, {manager, conn}} = Pglite.start_link()

Postgrex.transaction(conn, fn(conn) ->
  {:ok, _} = Postgrex.query(conn, "CREATE TABLE accounts (id INTEGER, balance INTEGER)", [])
  {:ok, _} = Postgrex.query(conn, "INSERT INTO accounts VALUES (1, 1000), (2, 500)", [])

  # Transfer money between accounts
  {:ok, _} = Postgrex.query(conn, "UPDATE accounts SET balance = balance - $1 WHERE id = 1", [100])
  {:ok, _} = Postgrex.query(conn, "UPDATE accounts SET balance = balance + $1 WHERE id = 2", [100])

  :ok
end)
```

## Technical Details

### Unix Socket Communication

The library uses the PostgreSQL wire protocol over Unix domain sockets:

- **Bun Side**: Uses `@electric-sql/pglite-socket` to create a PostgreSQL-compatible socket server
- **Elixir Side**: Standard Postgrex client connects to the Unix socket as if it were a regular PostgreSQL server
- **Protocol**: Full PostgreSQL wire protocol support (queries, transactions, prepared statements, etc.)
- **Performance**: Unix sockets provide lower latency than TCP for local communication

### Process Isolation & Multi-Instance Support

- Each Bun process has its own isolated memory space and Unix socket
- Multiple instances can run concurrently with different databases
- Automatic socket cleanup when connections are closed
- Process supervision for fault tolerance
- Support for both in-memory and persistent databases

### Socket Management

```bash
# Socket files are created in a temporary directory
/tmp/pglite_sockets/
├── pglite_12345.sock  # Instance 1
├── pglite_12346.sock  # Instance 2
└── pglite_12347.sock  # Instance 3
```

### Dependencies

#### Elixir Dependencies
- `postgrex` - PostgreSQL driver for Elixir
- `jason` - JSON encoding/decoding for communication with Bun process

#### JavaScript Dependencies (via Bun)
- `@electric-sql/pglite` - The core PGLite database
- `@electric-sql/pglite-socket` - Socket server for PostgreSQL wire protocol

## Installation

Add `pglite` to your list of dependencies in `mix.exs`:

```elixir
def deps do
  [
    {:pglite, "~> 0.1.0"}
  ]
end
```

### Self-Contained Setup with Version Management

PGLite automatically manages its JavaScript dependencies with intelligent version-based caching:

1. **Version Detection**: Automatically detects versions of `@electric-sql/pglite`, `@electric-sql/pglite-socket`, and `bun`
2. **Smart Caching**: Creates versioned optimized bundles (e.g., `pglite_optimized_9fc217d9.ts`) for cache invalidation
3. **Auto-Build**: Detects missing or outdated bundles and automatically builds them using `bun build`
4. **Dependency Resolution**: Automatically installs required npm packages when needed
5. **Bundle Creation**: Creates optimized, self-contained JavaScript bundle with all dependencies
6. **Asset Management**: Copies required WebAssembly files (`pglite.wasm`, `pglite.data`) to the correct location
7. **Cache Invalidation**: Automatically rebuilds when dependency versions change
8. **Cleanup**: Removes outdated versions to keep the project clean

No manual JavaScript setup required - just add the Elixir dependency and start using it!

## Prerequisites

- [Bun](https://bun.sh/) runtime (for executing PGLite)
- Elixir 1.18 or later
- Unix-like operating system (for Unix domain sockets)
- Internet connection (for initial JavaScript dependency installation)

## Development

```bash
# Install Elixir dependencies
mix deps.get

# Install JavaScript dependencies via Bun (for development)
bun install

# Run tests (versioned optimized bundle will be built automatically on first test run)
mix test

# Run tests with coverage
mix test --cover

# Build optimized bundle manually
mix pglite.build

# Force rebuild of optimized bundle
mix pglite.build --force

# Prepare package for distribution
mix pglite.package

# Clean up any orphaned processes and socket files (if needed)
./scripts/cleanup_pglite.sh
```

### Development Notes

- The versioned JavaScript bundle is automatically built when needed - no manual build step required
- For development, you can install JavaScript dependencies with `bun install`, but it's not required for normal usage
- The bundle includes all necessary dependencies and WebAssembly files for self-contained operation
- Version-based caching ensures rebuilds only happen when dependencies actually change
- Use `mix pglite.build --force` to force a rebuild during development
- Use `mix pglite.package` to prepare and validate the complete package for distribution

## API Reference

### `Pglite.start_link/1`

Starts a new PGLite instance and returns `{:ok, {manager_pid, postgrex_pid}}`.

**Options:**
- `:data_dir` - Directory for persistent database (default: in-memory)
- `:memory` - Force in-memory database (overrides `:data_dir`)
- `:name` - Name for the GenServer process

### `Pglite.stop/1`

Stops a PGLite instance using the manager PID.

### `Pglite.health_check/1`

Convenience function to check if the database connection is healthy.

## Use Cases

PGLite is perfect for scenarios where you need a lightweight PostgreSQL database without the overhead of a full PostgreSQL server:

### Development & Testing
- **Unit Tests**: Fast, isolated database instances for each test
- **Integration Tests**: Full PostgreSQL compatibility without external dependencies
- **Local Development**: Embedded database for prototyping and development

### Applications
- **Desktop Applications**: Embedded database that doesn't require PostgreSQL installation
- **Edge Computing**: Lightweight database for resource-constrained environments
- **Microservices**: Each service can have its own embedded database instance
- **Data Processing**: Temporary databases for ETL operations and data transformations

### Benefits over Traditional PostgreSQL
- **No Installation Required**: Runs entirely within your Elixir application
- **Zero Configuration**: No database servers to manage or configure
- **Process Isolation**: Each database runs in its own process
- **Memory Efficient**: In-memory databases for temporary data
- **Fast Startup**: Databases start in milliseconds, not seconds

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.