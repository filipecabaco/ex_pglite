# PGlite Performance

## Current Performance (3-minute benchmarks)

### Optimal Configuration: Pool Size = 1

| Workload | QPS | P50 | P99 | CPU | Memory |
|----------|-----|-----|-----|-----|--------|
| Reads | 542 | 2.2ms | 5ms | 95% | 985MB |
| Writes | 275 | 2.1ms | 10ms | 55% | 517MB |
| Transactions | 96 | 14ms | 31ms | 60% | 642MB |
| Mixed (33/33/33) | 111 | 3.8ms | 16ms | 85% | 561MB |

### Over-Concurrency Pitfall: Pool Size = 10

| Workload | QPS | P50 | P99 | Degradation |
|----------|-----|-----|-----|-------------|
| Reads | 63 | 7.4ms | 4000ms | **-88%** |
| Writes | 77 | 11ms | 66ms | **-72%** |
| Transactions | 21 | 42ms | 158ms | **-78%** |
| Mixed | 50 | 16ms | 87ms | **-55%** |

**Key Insight:** Higher connection pool sizes dramatically hurt performance with PGlite's single-threaded WASM backend. Each additional connection creates semaphore contention, adding latency without improving throughput.

---

## Why Pool Size Matters

PGlite runs in single-threaded WebAssembly. Only one query can execute at a time, enforced by a semaphore:

```
Pool Size = 1:  Query → Execute → Response
Pool Size = 10: Query₁ → Wait → Wait → Wait → Execute → Response
                Query₂ → Wait → Wait → Wait → Wait → Execute → Response
                ...
```

With pool_size=10:
- 10 connections compete for 1 execution slot
- 9 connections always waiting
- Context switching and scheduling overhead
- P99 latency explodes (5ms → 4000ms for reads)

**Recommendation:** Always use `pool_size: 1` for PGlite connections in your Elixir application:

```elixir
# In your application config
config :my_app, MyApp.Repo,
  pool_size: 1  # Critical for PGlite performance
```

---

## Key Discoveries

### Discovery 1: Pool Size = 1 is Optimal

Traditional database wisdom says "more connections = more throughput." With PGlite's single-threaded WASM, the opposite is true. Testing revealed:

- **88% throughput loss** with pool_size=10 vs pool_size=1
- **800x latency increase** for P99 (5ms → 4000ms)
- Zero benefit from additional connections

### Discovery 2: Async I/O Matters for Transactions

Replacing polling (`try_read` + 1ms sleep) with proper async I/O (`read().await`) yielded **+182% transaction throughput**. The artificial delay between statements (BEGIN → SELECT → UPDATE → COMMIT) was the bottleneck.

### Discovery 3: Memory Never Shrinks

WebAssembly lacks `memory.shrink`. Under load, memory grew to 1.4GB and never reclaimed. Instance recycling is the only solution.

---

## Improvements Completed

### 1. Proper Async I/O (Removed 1ms Polling Delay)

| Workload | Before | After | Improvement |
|----------|--------|-------|-------------|
| Transactions | 34 | 96 | **+182%** |
| Writes | 300 | 275 | -8% |
| Mixed | 243 | 111 | -54%* |

*Mixed workload varies significantly with memory pressure over longer runs

**What changed:** Replaced `try_read()` + 1ms sleep polling loop with proper `read().await` async I/O.

**Why transactions improved:** The polling delay added 1ms between every statement in a transaction (BEGIN, SELECT, UPDATE, COMMIT). For a 4-statement transaction, that's 4ms of artificial delay.

### 2. Priority-Based Query Scheduling

- High priority channel for COMMIT, ROLLBACK, END, ABORT, SAVEPOINT, RELEASE
- Biased `tokio::select!` ensures transaction control commands processed first
- Reduces lock hold time by prioritizing transaction completion

### 3. Fair Semaphore Scheduling

- Single WASM execution enforced via `Semaphore::const_new(1)`
- FIFO ordering prevents starvation
- Async connection handling with `tokio::net::TcpListener`

---

## Constraints

- **Single-threaded WASM**: Only one query executes at a time (semaphore-enforced)
- **No memory shrinking**: WebAssembly lacks `memory.shrink` - growth is permanent
- **PGlite single-user mode**: No native connection pooling or parallel execution
- **Pool size must be 1**: Higher pool sizes cause severe performance degradation

---

## Future Improvements

### Near-Term (Low Risk)

#### Instance Recycling for Memory Management
| Metric | Current | Target |
|--------|---------|--------|
| Memory | Grows to 1.4GB | Caps at 500MB |

Monitor WASM memory via `memory.data_size()`, gracefully recycle when threshold exceeded.

#### Synchronous Commit Off
| Metric | Current | Projected |
|--------|---------|-----------|
| Write QPS | 275 | 400-500 |

Set `synchronous_commit = off` for ephemeral/dev use cases.

#### PostgreSQL Tuning
```sql
SET synchronous_commit = off;
SET commit_delay = 10000;
SET checkpoint_timeout = '15min';
```

### Medium-Term (Medium Risk)

#### Transaction Pinning
Hold semaphore for entire transaction duration instead of per-query acquisition.
- Eliminates re-acquisition overhead between BEGIN and COMMIT
- Trade-off: Other connections wait longer during transactions

#### Optimistic Locking (Benchmark)
Replace `SELECT FOR UPDATE` with version-based optimistic locking to reduce lock contention.

### Long-Term (High Risk)

#### Application-Level Sharding
Route queries to multiple PGlite instances based on tenant/key.
- Linear scaling: 4 instances → ~2000 read QPS, ~1000 write QPS
- Requires application-level coordination

---

## Benchmark Configuration

```bash
# Default settings (pool_size=1 is now the default)
mix run benchmark/run.exs -n <profile> -d <seconds>

# Profiles: reads_only, writes_only, transactions_only, max
# Example: 3-minute read benchmark
mix run benchmark/run.exs -n reads_only -d 180

# To test concurrency overhead (not recommended for production)
mix run benchmark/run.exs -n reads_only -d 180 --pool-size 10
```

---

## What's Implemented

- [x] Tokio async runtime with fair semaphore scheduling
- [x] Priority channels (high: COMMIT/ROLLBACK, normal: queries)
- [x] Biased `tokio::select!` for priority processing
- [x] Proper async TCP connection handling (no polling delays)
- [x] Single binary with embedded WASM assets
- [x] Configurable connection pool size for benchmarks

---

## References

- [WebAssembly Memory Design](https://github.com/WebAssembly/design/issues/1397) - No memory.shrink
- [SQLite Optimizations](https://www.powersync.com/blog/sqlite-optimizations-for-ultra-high-performance) - fsync bottlenecks
- [PgCat](https://github.com/postgresml/pgcat) - Transaction pinning patterns
- [PGlite](https://pglite.dev/) - Single-user mode constraints
- [Wasmtime Config](https://docs.wasmtime.dev/api/wasmtime/struct.Config.html) - Engine optimization options
