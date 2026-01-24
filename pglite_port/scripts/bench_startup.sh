#!/bin/bash

PG_BIN="./target/release/pglite_port"
BASE_PORT=5450

echo "=== PGlite Port Startup Benchmark ==="
echo ""
echo "Testing startup time with embedded pgdata_seed"
echo "This includes asset extraction and PostgreSQL initialization"
echo ""

for run in {1..5}; do
    port=$((BASE_PORT + run))

    echo "Run $run (port $port):"
    start=$(date +%s%N)

    # Run binary and wait for "ready" message
    timeout 15 "$PG_BIN" memory:// "$port" 2>&1 | grep "ready" > /dev/null
    exit_code=$?

    end=$(date +%s%N)
    duration=$(( (end - start) / 1000000 ))

    if [ $exit_code -eq 0 ]; then
        echo "  ✓ Startup time: ${duration}ms"
    else
        echo "  ✗ Failed to start (exit code: $exit_code)"
    fi

    # Wait a bit between runs
    sleep 1
done

echo ""
echo "=== Binary Size ==="
ls -lh "$PG_BIN" | awk '{print "  Size: " $5}'
