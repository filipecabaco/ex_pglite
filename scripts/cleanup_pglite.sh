#!/bin/bash

# PGLite Cleanup Script
# Kills any orphaned pglite_socket_server processes and cleans up socket files

echo "🧹 PGLite Cleanup Script"
echo "======================="

# Find and kill pglite_socket_server processes
echo "🔍 Looking for PGLite processes..."
PIDS=$(pgrep -f pglite_socket_server)

if [ -z "$PIDS" ]; then
    echo "✅ No PGLite processes found"
else
    echo "🎯 Found PGLite processes: $PIDS"
    echo "🔪 Killing processes..."

    for pid in $PIDS; do
        echo "  Killing process $pid..."
        # Try SIGTERM first
        kill -TERM $pid 2>/dev/null
        sleep 0.1

        # Check if still running, if so use SIGKILL
        if kill -0 $pid 2>/dev/null; then
            echo "  Process $pid still running, using SIGKILL..."
            kill -KILL $pid 2>/dev/null
        fi
    done

    echo "✅ All PGLite processes killed"
fi

# Clean up socket files
echo "🧹 Cleaning up socket files..."
SOCKET_DIR="/tmp/pglite_sockets"

if [ -d "$SOCKET_DIR" ]; then
    SOCKET_COUNT=$(find "$SOCKET_DIR" -name "pglite_*.sock" 2>/dev/null | wc -l)

    if [ "$SOCKET_COUNT" -gt 0 ]; then
        echo "🎯 Found $SOCKET_COUNT socket files to clean up"
        rm -f "$SOCKET_DIR"/pglite_*.sock
        echo "✅ Socket files cleaned up"
    else
        echo "✅ No socket files to clean up"
    fi
else
    echo "✅ Socket directory doesn't exist"
fi

echo ""
echo "🎉 PGLite cleanup complete!"
echo ""
echo "Usage: Run this script anytime to clean up orphaned PGLite processes"
echo "  ./scripts/cleanup_pglite.sh"
