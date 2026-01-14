# ExPglite Benchmark Tool

A comprehensive benchmarking and profiling tool for measuring CPU, memory, and performance characteristics of ExPglite.

## Quick Start

```bash
# Run with defaults (1 instance, 60s, simple schema, medium intensity)
mix pglite.benchmark

# Quick smoke test (10 seconds)
mix pglite.benchmark -d 10 -n low
```

## Usage

```bash
mix pglite.benchmark [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--instances` | `-i` | Number of PgLite instances | 1 |
| `--duration` | `-d` | Benchmark duration in seconds | 60 |
| `--persistence` | `-p` | Persistence mode: `memory` or `file` | memory |
| `--schema` | `-s` | Schema type: `simple`, `complex`, `realistic` | simple |
| `--rows` | `-r` | Number of data rows to seed | 1000 |
| `--intensity` | `-n` | Workload intensity: `low`, `medium`, `high` | medium |
| `--sample-interval` | | Resource sampling interval in ms | 1000 |
| `--output` | `-o` | Output file for JSON results | none |
| `--cooldown` | `-c` | Cooldown period in seconds to monitor memory deflation | 0 |
| `--startup-timeout` | `-t` | Timeout in seconds for starting instances | 60 + instances × 30 |

## Test Examples

### Basic Tests

```bash
# Minimal smoke test
mix pglite.benchmark -d 10 -n low -r 100

# 1 minute baseline test
mix pglite.benchmark -d 60 -n low -o baseline.json

# Medium intensity for 5 minutes
mix pglite.benchmark -d 300 -n medium -o medium_5min.json
```

### Multi-Instance Tests

```bash
# 2 instances, low intensity, 2 minutes
mix pglite.benchmark -i 2 -d 120 -n low

# 3 instances, medium intensity, 5 minutes
mix pglite.benchmark -i 3 -d 300 -n medium -o multi_instance.json

# 5 instances stress test (10 minutes, with extended startup timeout)
mix pglite.benchmark -i 5 -d 600 -n medium -t 300 -o stress_5_instances.json

# 10 instances with longer startup timeout (10 min startup, 5 min benchmark)
mix pglite.benchmark -i 10 -d 300 -n low -t 600 -o many_instances.json
```

### Schema Complexity Tests

```bash
# Simple schema (single table)
mix pglite.benchmark -s simple -d 120 -o simple_schema.json

# Complex schema (e-commerce: users, products, orders)
mix pglite.benchmark -s complex -r 5000 -d 120 -o complex_schema.json

# Realistic schema (multi-tenant SaaS with JSONB, UUIDs)
mix pglite.benchmark -s realistic -r 10000 -d 120 -o realistic_schema.json
```

### Persistence Mode Tests

```bash
# In-memory mode (default, faster)
mix pglite.benchmark -p memory -d 120 -o memory_mode.json

# File persistence mode (slower, persistent)
mix pglite.benchmark -p file -d 120 -o file_mode.json

# Compare memory vs file with same workload
mix pglite.benchmark -p memory -d 300 -n medium -o memory_bench.json
mix pglite.benchmark -p file -d 300 -n medium -o file_bench.json
```

### Intensity Comparison Tests

```bash
# Low intensity (10 ops/sec, 90% reads)
mix pglite.benchmark -n low -d 180 -o low_intensity.json

# Medium intensity (100 ops/sec, 70% reads)
mix pglite.benchmark -n medium -d 180 -o medium_intensity.json

# High intensity (500 ops/sec, 50% reads)
mix pglite.benchmark -n high -d 180 -o high_intensity.json
```

### Long-Running Tests

```bash
# 30 minute soak test with 2 minute cooldown
mix pglite.benchmark -d 1800 -n medium -c 120 -o soak_30min.json

# 1 hour endurance test with cooldown to check memory stability
mix pglite.benchmark -d 3600 -n low -c 300 -o endurance_1hr.json

# Multi-instance long run (30 minutes, 3 instances, with cooldown)
mix pglite.benchmark -i 3 -d 1800 -n medium -c 180 -o long_multi_instance.json
```

### Memory Deflation Tests

Use the cooldown option to monitor memory behavior after workloads stop:

```bash
# High load test with 60 second cooldown to check memory deflation
mix pglite.benchmark -d 120 -n high -c 60 -o memory_deflation.json

# Multi-instance with cooldown to verify cleanup
mix pglite.benchmark -i 3 -d 300 -n medium -c 120 -o multi_cooldown.json
```

### Production-Like Scenarios

```bash
# Simulated production: realistic schema, file persistence, medium load
mix pglite.benchmark \
  -i 2 \
  -d 600 \
  -p file \
  -s realistic \
  -r 10000 \
  -n medium \
  -c 120 \
  -o production_sim.json

# High-load stress test with cooldown
mix pglite.benchmark \
  -i 3 \
  -d 300 \
  -s complex \
  -r 5000 \
  -n high \
  -c 60 \
  -o high_load_stress.json

# Memory efficiency test (many instances, extended startup, with cooldown)
mix pglite.benchmark \
  -i 5 \
  -d 600 \
  -n low \
  -r 500 \
  -t 300 \
  -c 120 \
  -o memory_efficiency.json
```

## Intensity Profiles

| Level | Ops/sec | Read/Write Ratio | Transaction % | Batch Size |
|-------|---------|------------------|---------------|------------|
| low | 10 | 90% reads | 10% | 1 |
| medium | 100 | 70% reads | 30% | 5 |
| high | 500 | 50% reads | 50% | 10 |

## Schema Types

### Simple
Single `benchmark_items` table with id, name, value, timestamp. Good for raw performance testing.

### Complex
E-commerce schema with:
- `users` - user accounts
- `categories` - product categories (self-referential)
- `products` - product catalog
- `orders` - customer orders
- `order_items` - order line items

### Realistic
Multi-tenant SaaS schema with:
- `tenants` - tenant organizations
- `accounts` - user accounts per tenant
- `sessions` - auth sessions
- `resources` - generic resources with JSONB data
- `events` - event log
- `audit_logs` - audit trail

Uses UUIDs, JSONB columns, and complex indexes.

## Output Metrics

The benchmark collects:

### Resource Usage
- CPU percentage (min, max, avg, P50, P95, P99)
- Memory in MB (min, max, avg, P50, P95, P99)
- Per-process breakdown
- System load average

### Throughput
- Total operations per second
- Reads per second
- Writes per second
- Transactions per second

### Latency
- Min, Max, Average
- P50, P95, P99 percentiles

### Workload Stats
- Total operations count
- Reads, writes, transactions breakdown
- Error count and rate

## JSON Output

Results are saved as JSON when using `-o`:

```bash
mix pglite.benchmark -d 60 -o results.json
cat results.json | jq '.throughput'
```

## Tips

1. **Start small**: Begin with `-d 10 -n low` to verify everything works
2. **Kill lingering processes**: If a benchmark crashes, run `pkill -f pglite_port`
3. **Enable debug logs**: Set `LOG_LEVEL=debug` if you need verbose output
4. **Compare fairly**: Use same `-r` (rows) when comparing different configs
5. **Watch for OOM**: High intensity + many instances can exhaust memory (each instance uses ~600-700 MB)
6. **Disk space**: Each instance copies the WASM binary (~22MB) to a temp directory

## Troubleshooting

### Port startup failed (exit 137)
Previous benchmark didn't clean up. Kill remaining processes:
```bash
pkill -f pglite_port
```

### Timeout errors during startup
Increase the startup timeout for many instances:
```bash
mix pglite.benchmark -i 5 -t 300
```

### Timeout errors during benchmark
Reduce intensity or number of instances:
```bash
mix pglite.benchmark -i 1 -n low
```

### High error rate
Check if schema matches workload. Simple schema doesn't support complex queries.
