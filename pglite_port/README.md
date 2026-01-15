# pglite_port

A Rust binary that runs PostgreSQL in-process using WebAssembly via the Wasmtime runtime. This enables running a full PostgreSQL database without any external dependencies.

## Overview

`pglite_port` loads a PostgreSQL WASM binary (PGlite) and exposes it as a standard TCP server implementing the PostgreSQL wire protocol. Clients like `psql` or Postgrex can connect to it as if it were a regular PostgreSQL server.

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

## Binaries

This crate produces two binaries:

| Binary | Description |
|--------|-------------|
| `pglite_port` | Main runtime that runs PostgreSQL and accepts TCP connections |
| `build_artifacts` | Build tool that creates pre-compiled artifacts for faster startup |

## Usage

### pglite_port

```bash
pglite_port <data_dir> <tcp_port> <wasm_path> <prefix_dir> [pgdata_seed_path]
```

**Arguments:**

| Argument | Description |
|----------|-------------|
| `data_dir` | Directory for PostgreSQL data. Use `memory://` for in-memory mode |
| `tcp_port` | TCP port to listen on (e.g., 5432) |
| `wasm_path` | Path to the `pglite.wasi` WebAssembly binary |
| `prefix_dir` | Directory containing PostgreSQL share files |
| `pgdata_seed_path` | Optional: Pre-initialized PGDATA tarball for faster startup |

**Examples:**

```bash
# In-memory database on port 5432
./pglite_port memory:// 5432 ./pglite.wasi ./pglite_prefix

# Persistent storage
./pglite_port /var/lib/pglite 5432 ./pglite.wasi ./pglite_prefix

# With pre-initialized seed for faster startup
./pglite_port memory:// 5432 ./pglite.wasi ./pglite_prefix ./pgdata_seed.tar.zst
```

### build_artifacts

Creates pre-compiled artifacts to speed up PGlite startup:

```bash
build_artifacts <wasm_path> <prefix_dir> <output_dir>
```

**Output files:**

| File | Description |
|------|-------------|
| `pglite.cwasm` | Pre-compiled native code from WASM (faster module loading) |
| `pgdata_seed.tar.zst` | Pre-initialized database (skips ~10s initdb on first run) |

## How It Works

### 1. Wasmtime Runtime

The binary uses [Wasmtime](https://wasmtime.dev/) to execute the PGlite WASM module. Key optimizations include:

- **Copy-on-write memory**: Uses `memory_init_cow(true)` for faster instantiation
- **Lazy table initialization**: Defers table element initialization with `table_lazy_init(true)`
- **Pre-compiled modules**: Loads `.cwasm` files (native code) instead of recompiling WASM each time
- **Dense memory images**: Pre-reserves 64MB for PostgreSQL's heap

### 2. WASI Filesystem

PostgreSQL running in WASM needs filesystem access. The binary sets up WASI preopened directories:

```
/tmp/pglite/          → PostgreSQL prefix (share files, etc.)
/tmp/pglite/base/     → PGDATA (database files)
/dev/                 → Read-only access to /dev/urandom
```

Environment variables configure PostgreSQL:

| Variable | Value | Purpose |
|----------|-------|---------|
| `PGDATA` | `/tmp/pglite/base` | Database directory |
| `PREFIX` | `/tmp/pglite` | PostgreSQL installation prefix |
| `PGDATABASE` | `template1` | Default database |
| `PGUSER` | `postgres` | Default user |

### 3. Memory vs Persistent Mode

**Memory mode** (`memory://`):
- Creates an isolated temporary directory per instance
- Copies PostgreSQL share files to the temp directory
- Automatically cleaned up when the process exits
- Perfect for testing and ephemeral workloads

**Persistent mode** (any filesystem path):
- Uses the specified directory for PGDATA
- Data survives process restarts
- Suitable for development databases that need to persist

### 4. PostgreSQL Wire Protocol

The binary implements a subset of the PostgreSQL wire protocol:

1. **Startup**: Clients send a startup message with protocol version and parameters
2. **Queries**: Simple and extended query protocols are supported
3. **Responses**: Results, errors, and status messages are forwarded to clients

Key wire protocol handling:

- **Server version injection**: Automatically adds `server_version` parameter (17.5) if missing
- **Error translation**: WASM traps are converted to proper PostgreSQL error codes
- **ReadyForQuery**: Ensures clients receive proper transaction state after each command

### 5. Error Handling

When PostgreSQL encounters an error in WASM (e.g., querying a non-existent table), it may trigger a WASM trap. The binary detects these traps and translates them to appropriate PostgreSQL error codes:

| WASM Function Pattern | PostgreSQL Code | Meaning |
|-----------------------|-----------------|---------|
| `parserOpenTable`, `RangeVarGetRelid` | 42P01 | Undefined table |
| `ParseFuncOrColumn`, `LookupFuncName` | 42883 | Undefined function |
| `transformColumnRef`, `colNameToVar` | 42703 | Undefined column |
| `scanner_yyerror`, `base_yyerror` | 42601 | Syntax error |
| `ExecConstraints`, `_bt_check_unique` | 23505 | Unique violation |
| `division_by_zero`, `int4div` | 22012 | Division by zero |

### 6. PGDATA Seed Optimization

The `pgdata_seed.tar.zst` file contains a pre-initialized PostgreSQL data directory. This optimization:

1. **Skips initdb**: First-time PostgreSQL initialization takes ~10 seconds
2. **Includes clean shutdown state**: Database files are in a consistent state
3. **Compressed with zstd**: ~2MB compressed vs ~20MB uncompressed

When a seed is provided, the binary extracts it directly instead of running `pgl_initdb`.

### 7. Signal Handling and Lifecycle

The binary monitors stdin for closure (indicating the parent process died) and initiates graceful shutdown:

```rust
// Pseudo-code
loop {
    if stdin.closed() {
        SHUTDOWN = true;
        break;
    }
}
// Wait for active connections to finish
// Clean up temporary directories
// Exit cleanly
```

## Communication Protocol

The binary communicates with its parent (typically Elixir) via JSON messages on stdout:

**Ready signal:**
```json
{"id": "ready", "success": true, "port": 5432}
```

**Error signal:**
```json
{"id": "ready", "success": false, "error": "Failed to bind port"}
```

## Architecture

### Source Files

| File | Description |
|------|-------------|
| `src/main.rs` | Entry point, CLI argument parsing, TCP accept loop |
| `src/lib.rs` | Core runtime: WASM loading, wire protocol, error handling |
| `src/bin/build_artifacts.rs` | Build tool for creating cwasm and pgdata seed |

### Key Structures

**PgliteConfig**: Configuration for creating a runtime instance
```rust
pub struct PgliteConfig {
    pub data_dir: PathBuf,           // Database directory or "memory://"
    pub tcp_port: u16,               // TCP port for connections
    pub wasm_path: PathBuf,          // Path to pglite.wasi
    pub prefix_dir: PathBuf,         // PostgreSQL share files
    pub pgdata_seed_path: Option<PathBuf>, // Optional pre-initialized PGDATA
}
```

**PgliteRuntime**: Manages the WASM instance and processes queries
```rust
pub struct PgliteRuntime {
    store: Arc<Mutex<Store<WasiP1Ctx>>>,  // Wasmtime store with WASI context
    instance: wasmtime::Instance,          // Instantiated WASM module
    tcp_port: u16,
    data_dir: PathBuf,
    buffer_addr: u32,                      // Shared buffer address in WASM memory
    buffer_size: u32,                      // Buffer size for wire messages
    memory_tmp_dir: Option<PathBuf>,       // Temp dir (memory mode only)
}
```

## Dependencies

| Crate | Purpose |
|-------|---------|
| `wasmtime` | WebAssembly runtime |
| `wasmtime-wasi` | WASI implementation for filesystem/stdio |
| `serde_json` | JSON serialization for communication protocol |
| `anyhow` | Error handling |
| `zstd` | Compression for PGDATA seed |
| `tar` | Tarball creation/extraction |

## Debug Mode

Set `PGLITE_DEBUG=1` to enable verbose logging:

```bash
PGLITE_DEBUG=1 ./pglite_port memory:// 5432 ./pglite.wasi ./pglite_prefix
```

This outputs detailed information about:
- Runtime initialization steps
- WASM function calls
- TCP connections and disconnections
- Wire protocol messages
- Shutdown sequence

## Building

```bash
cd pglite_port
cargo build --release

# Binaries are in target/release/
ls target/release/pglite_port target/release/build_artifacts
```

## Testing

```bash
cargo test
```

Tests cover:
- TCP socket binding
- Wire protocol message parsing
- Error code detection from WASM traps
- Server version injection
- Response completeness checking
