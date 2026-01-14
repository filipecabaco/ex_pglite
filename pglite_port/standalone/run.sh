#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=${1:-5432}
DATA_DIR=${2:-"memory://"}
exec "$DIR/pglite_port" "$DATA_DIR" "$PORT" "$DIR/pglite.wasi" "$DIR/pglite_prefix" "$DIR/pgdata_seed.tar.zst"
