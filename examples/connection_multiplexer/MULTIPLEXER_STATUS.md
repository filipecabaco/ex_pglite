# Connection Multiplexer Example

This example demonstrates the PGlite connection multiplexer feature that allows multiple concurrent PostgreSQL connections.

## What Was Created

### Files
- `examples/connection_multiplexer/` - New example directory
  - `lib/multiplexer_demo.ex` - Demonstration code showing concurrent connections
  - `mix.exs` - Mix project configuration
  - `README.md` - Documentation

### What the Demo Tests

1. **Basic Queries** - Single connection executing sequential queries
2. **Concurrent Connections** - 3 connections simultaneously querying
3. **Stress Test** - 10 connections each executing 5 queries

## What We Discovered

### Without Multiplexer (Current Behavior)

When using PGlite without multiplexer mode, concurrent connections FAIL:

```
** (EXIT from #PID<0.101.0>) an exception was raised:
    ** (MatchError) no match of right hand side value:
      {:error, %Postgrex.Error{
         postgres: %{
           code: :internal_error,
           message: "WASM trap: error while executing..."
         }
       }}
```

**Root Cause**: PGlite's WASM instance only supports one query at a time. When multiple client connections attempt concurrent queries, the WASM backend traps/crashes.

### With Multiplexer (Branch: `claude/pglite-connection-pool-mORMD`)

The multiplexer solves this by:

1. Accepting multiple PostgreSQL client connections
2. Serializing all queries through a single backend
3. Using FIFO queue to ensure sequential execution
4. Providing illusion of concurrent connections to clients

**Verification**: Using `--multiplexer queue` flag:

```bash
$ pglite_port memory://demo 54322 pglite.wasi pglite_prefix pgdata_seed.tar.zst --multiplexer queue
{"id":"ready","multiplexer":"query_queue","port":54322,"success":true}
```

The ready signal correctly shows `"multiplexer":"query_queue"`.

## How to Use

### Option 1: Direct Binary Usage (Recommended for Testing)

```bash
# Start PGlite with multiplexer
$ PGLITE_DEBUG=0 priv/bin/pglite_port memory://demo 54322 \
    priv/pglite.wasi priv/pglite_prefix \
    priv/pgdata_seed.tar.zst \
    --multiplexer queue &

# Connect multiple psql clients
$ PGPORT=54322 PGPASSWORD=password psql -h 127.0.0.1 -U postgres -c "SELECT 1" &
$ PGPORT=54322 PGPASSWORD=password psql -h 127.0.0.1 -U postgres -c "SELECT 2" &
$ PGPORT=54322 PGPASSWORD=password psql -h 127.0.0.1 -U postgres -c "SELECT 3" &
```

### Option 2: Elixir Library (Requires Update)

**Current Status**: Elixir library (lib/pglite.ex) does NOT yet support multiplexer mode arguments.

**Required Changes**:
1. Add `:multiplexer_mode` option to `Pglite.start_link/1`
2. Pass `--multiplexer <mode>` to Rust binary
3. Add `:multiplexer_config` for queue size and timeout settings

Example (after implementation):
```elixir
# Start PGlite with query queue multiplexer
{:ok, pglite} = Pglite.start_link(
  multiplexer_mode: :queue,
  multiplexer_config: %{
    queue_size: 1000,
    query_timeout_ms: 30_000
  }
)

# Multiple connections work seamlessly
{:ok, conn1} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
{:ok, conn2} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
{:ok, conn3} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

# All queries are serialized by multiplexer
Task.async(fn -> Postgrex.query!(conn1, "SELECT 1", []) end)
Task.async(fn -> Postgrex.query!(conn2, "SELECT 2", []) end)
Task.async(fn -> Postgrex.query!(conn3, "SELECT 3", []) end)
```

## Implementation Status

### ✅ Completed
1. Rust binary with multiplexer support (`pglite_port`)
   - QueryQueue mode implementation
   - Extensible design for future modes
   - CLI arguments: `--multiplexer`, `--queue-size`, `--query-timeout`
   - Comprehensive tests in `pglite_port/tests/integration_test.rs`

2. Example Elixir code (`examples/connection_multiplexer/`)
   - Demonstrates concurrent connection use cases
   - Shows expected behavior with/without multiplexer

3. Binary compiled and tested
   - Multiplexer mode verified in ready signal
   - Basic functionality confirmed

### 🚧 Pending
1. Elixir library updates to expose multiplexer configuration
2. Documentation updates for multiplexer usage
3. Integration tests with multiple concurrent connections

## Architecture

### Multiplexer Flow

```
Client 1 ──┐
Client 2 ──┤
Client 3 ──┤─→ Query Queue (MPSC Channel) → Executor Thread → PGlite WASM Backend
Client N ──┘                          (Sequential)
                                     ↓
                                 Responses (MPSC Channels)
                                     ↓
Client 1 ──┐
Client 2 ──┤←───── Dispatch to connections
Client 3 ──┘
```

### Key Components

1. **ConnectionMultiplexer** (`pglite_port/src/multiplexer.rs`)
   - Manages query queue and executor thread
   - Allocates connection IDs for tracking
   - Handles query timeout and shutdown

2. **Executor Loop** (`ConnectionMultiplexer::executor_loop`)
   - Single thread processing queries sequentially
   - Calls `runtime.process_wire_message()` for each query
   - Sends responses back via channels

3. **Connection Handler** (`ConnectionMultiplexer::handle_connection`)
   - Reads from client TCP socket
   - Submits query to queue
   - Waits for response and writes to client

## Performance Characteristics

### Sequential Execution
Queries are guaranteed to execute in order received, one at a time.

### Concurrency Benefits
- Multiple client connections can be open simultaneously
- No connection failures due to concurrent access
- Better resource utilization (fewer connection opens/closes)

### Limitations
- Queries still execute sequentially (not parallel)
- Multiplexer adds minimal overhead (channel passing)
- Best for I/O-bound workloads, not CPU-bound parallel queries

## Testing the Example

### Run with Current Elixir Library (Without Multiplexer)

```bash
cd examples/connection_multiplexer
mix deps.get
mix run -e "MultiplexerDemo.run()"
```

**Expected**: First test passes, concurrent tests fail with WASM trap errors.

### Run with Manual Binary (With Multiplexer)

```bash
# Terminal 1: Start PGlite
PGLITE_DEBUG=0 ../priv/bin/pglite_port memory://demo 54322 \
    ../priv/pglite.wasi ../priv/pglite_prefix \
    ../priv/pgdata_seed.tar.zst \
    --multiplexer queue

# Terminal 2: Run psql clients
PGPORT=54322 PGPASSWORD=password psql -h 127.0.0.1 -U postgres -c "SELECT 1"
PGPORT=54322 PGPASSWORD=password psql -h 127.0.0.1 -U postgres -c "SELECT 2"
```

**Expected**: All queries execute successfully without errors.

## Next Steps

1. Merge multiplexer support into Elixir library (`lib/pglite.ex`)
2. Update main README with multiplexer usage examples
3. Consider adding `TransactionAware` mode for better transaction handling
4. Benchmark performance with and without multiplexer

## References

- Multiplexer Implementation: `pglite_port/src/multiplexer.rs` (707 lines)
- Integration Tests: `pglite_port/tests/integration_test.rs` (283 lines added)
- Research Document: `docs/PGLITE_CONNECTION_POOL_RESEARCH.md` (branch history)
- Original Commit: `d04a3cb` - "Code cleanup and comprehensive tests for multiplexer"
