.PHONY: all clean install standalone

BINARY_NAME=pglite_port
BIN_DIR=../priv/bin
STANDALONE_DIR=standalone

all: install

install:
	@echo "Building PGlite port binary (Rust)..."
	@mkdir -p $(BIN_DIR)
	cargo build --release
	cp target/release/$(BINARY_NAME) $(BIN_DIR)/$(BINARY_NAME)
	@echo "Binary built: $(BIN_DIR)/$(BINARY_NAME)"

standalone:
	@echo "=== Building standalone PGlite distribution ==="
	@mkdir -p $(STANDALONE_DIR)
	@echo "Step 1/4: Building Rust binary..."
	cargo build --release
	cp target/release/$(BINARY_NAME) $(STANDALONE_DIR)/$(BINARY_NAME)
	@echo "Step 2/4: Extracting WASM assets..."
	tar -xJf assets/pglite-wasi.tar.xz -C $(STANDALONE_DIR)/
	mv $(STANDALONE_DIR)/tmp/pglite/bin/pglite.wasi $(STANDALONE_DIR)/pglite.wasi
	mkdir -p $(STANDALONE_DIR)/pglite_prefix/tmp/pglite
	mv $(STANDALONE_DIR)/tmp/pglite/share $(STANDALONE_DIR)/pglite_prefix/tmp/pglite/share
	mv $(STANDALONE_DIR)/tmp/pglite/lib $(STANDALONE_DIR)/pglite_prefix/tmp/pglite/lib
	mv $(STANDALONE_DIR)/tmp/pglite/password $(STANDALONE_DIR)/pglite_prefix/tmp/pglite/password
	rm -rf $(STANDALONE_DIR)/tmp
	@echo "Step 3/4: Creating pre-compiled artifacts (this may take ~60s)..."
	cargo run --release --bin build_artifacts -- \
		$(STANDALONE_DIR)/pglite.wasi \
		$(STANDALONE_DIR)/pglite_prefix \
		$(STANDALONE_DIR)
	@echo "Step 4/5: Creating run script..."
	@echo '#!/bin/bash' > $(STANDALONE_DIR)/run.sh
	@echo 'DIR="$$(cd "$$(dirname "$$0")" && pwd)"' >> $(STANDALONE_DIR)/run.sh
	@echo 'PORT=$${1:-5432}' >> $(STANDALONE_DIR)/run.sh
	@echo 'DATA_DIR=$${2:-"memory://"}' >> $(STANDALONE_DIR)/run.sh
	@echo 'exec "$$DIR/pglite_port" "$$DATA_DIR" "$$PORT" "$$DIR/pglite.wasi" "$$DIR/pglite_prefix" "$$DIR/pgdata_seed.tar.zst"' >> $(STANDALONE_DIR)/run.sh
	chmod +x $(STANDALONE_DIR)/run.sh
	@echo "Step 5/5: Creating README..."
	@echo '# PGlite Standalone' > $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo 'A standalone PostgreSQL instance running via WebAssembly.' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '## Quick Start' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '```bash' >> $(STANDALONE_DIR)/README.md
	@echo './run.sh' >> $(STANDALONE_DIR)/README.md
	@echo '```' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '## Usage' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '```bash' >> $(STANDALONE_DIR)/README.md
	@echo './run.sh [PORT] [DATA_DIR]' >> $(STANDALONE_DIR)/README.md
	@echo '```' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '| Argument | Default | Description |' >> $(STANDALONE_DIR)/README.md
	@echo '|----------|---------|-------------|' >> $(STANDALONE_DIR)/README.md
	@echo '| PORT | 5432 | TCP port to listen on |' >> $(STANDALONE_DIR)/README.md
	@echo '| DATA_DIR | memory:// | Data directory (use `memory://` for in-memory mode) |' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '## Examples' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '```bash' >> $(STANDALONE_DIR)/README.md
	@echo '# In-memory database on port 5432' >> $(STANDALONE_DIR)/README.md
	@echo './run.sh' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '# In-memory database on port 5433' >> $(STANDALONE_DIR)/README.md
	@echo './run.sh 5433' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '# Persistent storage' >> $(STANDALONE_DIR)/README.md
	@echo './run.sh 5432 /tmp/mydb' >> $(STANDALONE_DIR)/README.md
	@echo '```' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '## Connecting' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo 'Default credentials: `postgres` / `password`' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '```bash' >> $(STANDALONE_DIR)/README.md
	@echo 'PGPASSWORD=password psql "host=127.0.0.1 port=5432 user=postgres dbname=template1 sslmode=disable"' >> $(STANDALONE_DIR)/README.md
	@echo '```' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '## Files' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '| File | Description |' >> $(STANDALONE_DIR)/README.md
	@echo '|------|-------------|' >> $(STANDALONE_DIR)/README.md
	@echo '| pglite_port | Main binary (Wasmtime runtime) |' >> $(STANDALONE_DIR)/README.md
	@echo '| pglite.wasi | PostgreSQL WASM module |' >> $(STANDALONE_DIR)/README.md
	@echo '| pglite.cwasm | Pre-compiled native code (faster startup) |' >> $(STANDALONE_DIR)/README.md
	@echo '| pgdata_seed.tar.zst | Pre-initialized database (skips initdb) |' >> $(STANDALONE_DIR)/README.md
	@echo '| pglite_prefix/ | PostgreSQL share files |' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '## Environment Variables' >> $(STANDALONE_DIR)/README.md
	@echo '' >> $(STANDALONE_DIR)/README.md
	@echo '- `PGLITE_DEBUG=1` - Enable verbose debug output' >> $(STANDALONE_DIR)/README.md
	@echo ""
	@echo "=== Standalone build complete! ==="
	@echo "Directory: $(STANDALONE_DIR)/"
	@echo "See $(STANDALONE_DIR)/README.md for usage instructions."

clean:
	@echo "Cleaning PGlite port..."
	@rm -f $(BIN_DIR)/$(BINARY_NAME)
	@rm -rf $(STANDALONE_DIR)
	@cargo clean
