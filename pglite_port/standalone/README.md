# PGlite Standalone

A standalone PostgreSQL instance running via WebAssembly.

## Quick Start

```bash
./run.sh
```

## Usage

```bash
./run.sh [PORT] [DATA_DIR]
```

| Argument | Default | Description |
|----------|---------|-------------|
| PORT | 5432 | TCP port to listen on |
| DATA_DIR | memory:// | Data directory (use `memory://` for in-memory mode) |

## Examples

```bash
# In-memory database on port 5432
./run.sh

# In-memory database on port 5433
./run.sh 5433

# Persistent storage
./run.sh 5432 /tmp/mydb
```

## Connecting

```bash
psql "host=127.0.0.1 port=5432 user=postgres dbname=template1 sslmode=disable"
```

## Files

| File | Description |
|------|-------------|
| pglite_port | Main binary (Wasmtime runtime) |
| pglite.wasi | PostgreSQL WASM module |
| pglite.cwasm | Pre-compiled native code (faster startup) |
| pgdata_seed.tar.zst | Pre-initialized database (skips initdb) |
| pglite_prefix/ | PostgreSQL share files |

## Environment Variables

- `PGLITE_DEBUG=1` - Enable verbose debug output
