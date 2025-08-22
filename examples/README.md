# PGLite Examples

This folder contains various examples demonstrating how to use PGLite in different scenarios. Each example is now a proper Mix project following production-ready patterns.

## Prerequisites

- [Bun](https://bun.sh/) runtime installed and available in PATH
- Elixir 1.18 or later

## Examples

### 1. Simple Queries (`simple_queries/`)

A Mix project demonstrating basic database operations:
- Creating tables
- Inserting, updating, and deleting data
- Basic SELECT queries with parameters
- Data aggregation

**Run with:**
```bash
cd examples/simple_queries
mix deps.get
mix run --no-halt -e "SimpleQueries.run()"
```

### 2. Transactions (`transactions/`)

A Mix project showing transaction handling:
- Successful money transfers between accounts
- Transaction rollback demonstration
- Error handling and recovery

**Run with:**
```bash
cd examples/transactions
mix deps.get
mix run --no-halt -e "Transactions.run()"
```

### 3. Ecto Integration (`ecto_integration/`)

A properly structured Ecto project showing:
- Standard Ecto project layout with config/migrations/schemas
- Proper module separation (Repo, User schema, Application)
- Migration management
- CRUD operations with changesets
- Query demonstrations

**Run with:**
```bash
cd examples/ecto_integration
mix deps.get  
mix run --no-halt -e "EctoIntegration.run()"
```

### 4. Multiple Databases (`multiple_databases/`)

A Mix project demonstrating running multiple PGLite instances:
- Separate databases for different business domains
- Cross-database operations and analytics
- Business intelligence reporting

**Run with:**
```bash
cd examples/multiple_databases
mix deps.get
mix run --no-halt -e "MultipleDatabases.run()"
```

## Project Structure

Each example now follows proper Mix project conventions:

```
simple_queries/
├── mix.exs                 # Dependencies and project config
├── lib/
│   └── simple_queries.ex   # Main logic
└── README.md              # Project-specific instructions

ecto_integration/  
├── mix.exs
├── config/
│   └── config.exs          # Application configuration
├── lib/
│   ├── ecto_integration.ex # Main demo module
│   └── ecto_integration/
│       ├── application.ex  # Application supervisor
│       ├── repo.ex        # Ecto repository
│       └── user.ex        # User schema
├── priv/repo/migrations/   # Database migrations
│   └── 20241201000001_create_users.exs
└── README.md
```

## How It Works

1. **PGLite Manager**: Each example starts a PGLite instance using `Pglite.start_link()`
2. **Connection Options**: Uses `Pglite.get_connection_opts/1` to get socket path and connection details
3. **Database Connection**: Establishes Postgrex connections or configures Ecto repos with the socket information
4. **Clean Architecture**: Follows Elixir/Phoenix conventions for maintainability

## Key Benefits of New Structure

- **Production-Ready**: Each example follows the same patterns you'd use in real applications
- **Dependency Management**: Proper `mix.exs` files with explicit dependencies
- **Module Organization**: Clear separation of concerns
- **Configuration Management**: Standard Elixir configuration patterns
- **Testing Ready**: Structure supports easy addition of tests

## Running Examples

Each example directory contains its own README with specific instructions, but the general pattern is:

```bash
cd examples/{example_name}
mix deps.get
mix run --no-halt -e "{ModuleName}.run()"
```

## Development

To modify examples:
1. Navigate to the specific example directory
2. Edit the relevant modules in `lib/`
3. Run `mix run` to test your changes
4. Use `mix test` to run tests (where available)

This structure makes it easy to copy example code into your own projects while maintaining proper Elixir conventions.
