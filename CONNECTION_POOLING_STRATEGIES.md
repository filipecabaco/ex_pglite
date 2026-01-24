# PGlite Performance Plan

## Current Baseline (Single Instance)

| Workload | QPS | P50 | P99 | CPU | Bottleneck |
|----------|-----|-----|-----|-----|------------|
| Reads | 735 | 1.2ms | 4ms | 91% | CPU-bound |
| Writes | 300 | 1ms | 9ms | 36% | WAL fsync |
| Transactions | 34 | 53ms | 116ms | 20% | Row lock contention |
| Mixed (33/33/33) | 243 | 4.7ms | 13ms | 60% | Semaphore saturation |

## Constraints

- **Single-threaded WASM**: Only one query executes at a time (semaphore-enforced)
- **No memory shrinking**: WebAssembly lacks `memory.shrink` - growth is permanent
- **PGlite single-user mode**: No native connection pooling or parallel execution

---

## Performance Improvements

### Phase 1: Quick Wins (< 1 day total)

#### 1.1 Disable Synchronous Commit
| Metric | Before | After | Gain |
|--------|--------|-------|------|
| Write QPS | 300 | 500-600 | +60-80% |

**What:** Set `synchronous_commit = off` during PGlite initialization.

**Why:** Writes at 300 QPS with only 36% CPU = I/O bound on WAL fsync. For in-memory/ephemeral databases, durability trade-off is acceptable.

**Risk:** Data loss on crash (acceptable for dev/test/ephemeral use cases).

#### 1.2 Remove Artificial Delays
| Metric | Before | After | Gain |
|--------|--------|-------|------|
| Latency | Baseline | -5-10% | +5-10% |

**What:** Audit connection handling for any `sleep()` or timeout-based batching delays.

**Why:** Same-process execution has no network round-trips - delays only add latency.

---

### Phase 2: Benchmark Fixes (1 day)

#### 2.1 Replace FOR UPDATE with Optimistic Locking
| Metric | Before | After | Gain |
|--------|--------|-------|------|
| Transaction QPS | 34 | 150-200 | +340-490% |

**What:** Change benchmark's `SELECT ... FOR UPDATE` to version-based optimistic locking.

**Why:** Row-level locks held for entire transaction duration cause severe contention. With 1000 rows and 2 random IDs per transaction, collision probability compounds under load.

**Pattern:**
```
1. SELECT value, version WHERE id = $1 (no lock)
2. UPDATE SET value = $1, version = version + 1 WHERE id = $2 AND version = $3
3. If rows_affected = 0, retry or abort (version conflict)
```

---

### Phase 3: Memory Management (1-2 days)

#### 3.1 Instance Recycling
| Metric | Before | After | Gain |
|--------|--------|-------|------|
| Memory stability | Grows to 800MB+ | Caps at 500MB | Stability |

**What:** Monitor WASM memory usage; gracefully recycle instance when threshold exceeded.

**Why:** WebAssembly has no `memory.shrink` instruction. Memory allocated during load spikes cannot be reclaimed.

**Implementation:**
- Track memory via `memory.data_size()`
- Threshold: 500MB recommended
- Graceful shutdown: drain connections, persist if needed, restart

---

### Phase 4: Scheduling Optimizations (2-3 days)

#### 4.1 Opportunistic Query Batching
| Metric | Before | After | Gain |
|--------|--------|-------|------|
| Throughput (high concurrency) | Baseline | +10-20% | +10-20% |

**What:** Collect immediately-available queries before acquiring semaphore.

**Why:** Reduces semaphore acquisition overhead when multiple queries are queued.

**Critical:** Use `try_recv()` only - NO timeouts. Batching benefit is from processing what's already waiting, not from artificial delays.

**When effective:** >50 concurrent connections. Negligible benefit at low concurrency.

#### 4.2 Transaction Pinning
| Metric | Before | After | Gain |
|--------|--------|-------|------|
| Transaction latency | Baseline | -30-50% | +30-50% |

**What:** Hold semaphore for entire transaction duration instead of per-query acquisition.

**Why:** Eliminates re-acquisition overhead between BEGIN and COMMIT/ROLLBACK.

**Trade-off:** Other connections wait longer during transactions. Best when transactions are fast.

---

### Phase 5: Horizontal Scaling (1+ week)

#### 5.1 Application-Level Sharding
| Metric | Before | After (4 shards) | Gain |
|--------|--------|------------------|------|
| Read QPS | 735 | ~2500 | +240% |
| Write QPS | 300 | ~1000 | +230% |

**What:** Route queries to multiple PGlite instances based on tenant/key.

**Why:** PGlite's single-user mode means horizontal scaling requires application coordination.

**Patterns:**
- **Tenant sharding**: `instance = tenant_id % shard_count`
- **Functional partitioning**: Separate instances for users, events, cache
- **Read replicas**: Multiple read instances with single write primary

---

## Implementation Roadmap

| # | Improvement | Expected Gain | Effort | Risk | Status |
|---|-------------|---------------|--------|------|--------|
| 1 | `synchronous_commit = off` | +60-80% write QPS | 30 min | Medium* | 📋 |
| 2 | Remove artificial delays | +5-10% latency | 30 min | None | 📋 |
| 3 | Optimistic locking (benchmark) | +340% tx QPS | 1 day | Low | 📋 |
| 4 | Instance recycling | Memory stability | 1 day | Low | 📋 |
| 5 | Opportunistic batching | +10-20% throughput | 1 day | Low | 📋 |
| 6 | Transaction pinning | +30-50% tx latency | 2 days | Medium | 📋 |
| 7 | Application sharding | Linear scaling | 1 week | High | 📋 |

*Medium risk = durability trade-off, acceptable for ephemeral use cases

---

## Projected Performance (After Phase 1-4)

| Workload | Current | Projected | Improvement |
|----------|---------|-----------|-------------|
| Reads | 735 QPS | 800-850 QPS | +10-15% |
| Writes | 300 QPS | 500-600 QPS | +60-100% |
| Transactions | 34 QPS | 150-200 QPS | +340-490% |
| Mixed | 243 QPS | 350-400 QPS | +45-65% |

---

## What's Already Implemented

- [x] Tokio async runtime with fair semaphore scheduling
- [x] Priority channels (high: COMMIT/ROLLBACK, normal: queries)
- [x] Biased `tokio::select!` for priority processing
- [x] Async TCP connection handling

---

## References

- [WebAssembly Memory Design](https://github.com/WebAssembly/design/issues/1397) - No memory.shrink
- [SQLite Optimizations](https://www.powersync.com/blog/sqlite-optimizations-for-ultra-high-performance) - fsync bottlenecks
- [PgCat](https://github.com/postgresml/pgcat) - Transaction pinning patterns
- [PGlite](https://pglite.dev/) - Single-user mode constraints
