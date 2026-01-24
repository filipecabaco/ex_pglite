# PGlite Port

A Wasmtime-based PostgreSQL runtime that runs PostgreSQL via WebAssembly.

## Features

- **Single Binary Distribution**: All assets embedded in the binary - no external files required
- **Fast Startup**: Optimized for quick initialization (~100ms)
- **Memory Mode**: Run entirely in-memory or with persistent storage
- **Protocol Compatible**: Full PostgreSQL wire protocol support

## Quick Start

Build the release binary with embedded assets:

```bash
make build-release
```

Run with embedded assets (no paths needed):

```bash
# In-memory database on port 5432
./target/release/pglite_port memory:// 5432

# Persistent storage
./target/release/pglite_port /tmp/mydb 5432
```

## Connecting

```bash
# Using psql
PGPASSWORD=password psql "host=127.0.0.1 port=5432 user=postgres dbname=template1 sslmode=disable"

# Connection string for any PostgreSQL client
postgresql://postgres:password@127.0.0.1:5432/template1
```

## Command Line Options

```bash
Usage: ./pglite_port <data_dir> <tcp_port> [wasm_path] [prefix_dir] [pgdata_seed_path]

Arguments:
  data_dir         - Directory for PostgreSQL data (use memory:// for in-memory)
  tcp_port         - TCP port for PostgreSQL connections
  wasm_path        - Optional: Path to pglite.wasi binary (embedded if omitted)
  prefix_dir       - Optional: Directory containing pglite prefix files (embedded if omitted)
  pgdata_seed_path - Optional: Pre-initialized PGDATA tarball (faster startup)
```

## Build Targets

```bash
make help              # Show all available targets
make build-release     # Build optimized release binary
make test              # Run all tests
make clean             # Clean build artifacts
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          pglite_port                            │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  TCP Server  │───▶│ Wire Proto   │───▶│ Wasmtime Runtime │  │
│  │ (127.0.0.1)  │◀───│   Handler    │◀───│   (PGlite WASM)  │  │
│  └──────────────┘    └──────────────┘    └──────────────────┘  │
│         ▲                                         │             │
│         │                                         ▼             │
│   PostgreSQL                               ┌──────────────┐    │
│    Clients                                 │   PGDATA     │    │
│                                            │ (memory/disk)│    │
│                                            └──────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## How It Works

### Wasmtime Runtime

The binary uses [Wasmtime](https://wasmtime.dev/) to execute the PGlite WASM module:

- **Copy-on-write memory**: Uses `memory_init_cow(true)` for faster instantiation
- **Lazy table initialization**: Defers table element initialization
- **Pre-compiled modules**: Loads `.cwasm` files (native code) instead of recompiling WASM
- **Dense memory images**: Pre-reserves 64MB for PostgreSQL's heap

### Memory vs Persistent Mode

**Memory mode** (`memory://`):
- Creates an isolated temporary directory per instance
- Automatically cleaned up when the process exits
- Perfect for testing and ephemeral workloads

**Persistent mode** (any filesystem path):
- Uses the specified directory for PGDATA
- Data survives process restarts

### Error Handling

WASM traps are translated to appropriate PostgreSQL error codes:

| WASM Function Pattern | PostgreSQL Code | Meaning |
|-----------------------|-----------------|---------|
| `parserOpenTable` | 42P01 | Undefined table |
| `ParseFuncOrColumn` | 42883 | Undefined function |
| `transformColumnRef` | 42703 | Undefined column |
| `scanner_yyerror` | 42601 | Syntax error |
| `ExecConstraints` | 23505 | Unique violation |

## Environment Variables

- `PGLITE_DEBUG=1` - Enable verbose debug output

## Testing

```bash
cargo test
```

Tests cover:
- TCP socket binding
- Wire protocol message parsing
- Error code detection from WASM traps
- Server version injection

## Asset Structure

Assets are embedded in the binary at compile time:

- `assets/pglite.wasi` - PostgreSQL WASM module
- `assets/pglite.cwasm` - Pre-compiled native code (faster startup)
- `assets/pgdata_seed.tar.zst` - Pre-initialized database seed
- `assets/prefix.tar.zst` - PostgreSQL share files

## Performance

See [PERFORMANCE.md](../PERFORMANCE.md) for detailed benchmarks.

Key findings:
- **Use pool_size: 1** - Higher pool sizes cause 55-88% performance degradation
- **542 QPS reads**, **275 QPS writes**, **96 QPS transactions** (single instance)
