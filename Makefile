.PHONY: help setup build build-wasm build-port clean test

# Default target
help:
	@echo "PGlite Elixir - Build targets:"
	@echo "  setup      - Initialize submodule"
	@echo "  build-wasm - Build WASM from PGlite submodule"
	@echo "  build-port - Build Go port binary"
	@echo "  build      - Build complete project (WASM + port + Elixir)"
	@echo "  clean      - Remove build artifacts"
	@echo "  test       - Run tests"

# Initialize git submodule and install dependencies
setup:
	@echo "Initializing PGlite submodule..."
	git submodule update --init --recursive
	@echo "Submodule initialized"

# Build WASM and JavaScript packages from PGlite submodule
build-wasm:
	@echo "Building PGlite from submodule..."
	@echo "This requires Docker, Node.js 20+, and pnpm"
	@if [ ! -d "pglite" ]; then \
		echo "Error: pglite submodule not found. Run 'make setup' first."; \
		exit 1; \
	fi
	@cd pglite && \
		echo "Installing dependencies..." && \
		pnpm install && \
		echo "Building WASM and packages..." && \
		pnpm build:all
	@echo "Copying WASM files to priv/pglite/..."
	@mkdir -p priv/pglite
	@cp pglite/packages/pglite/release/postgres.wasm priv/pglite/ 2>/dev/null || \
		cp pglite/packages/pglite/dist/postgres.wasm priv/pglite/ 2>/dev/null || \
		echo "Warning: Could not find postgres.wasm"
	@cp pglite/packages/pglite/release/postgres.data priv/pglite/ 2>/dev/null || \
		cp pglite/packages/pglite/dist/postgres.data priv/pglite/ 2>/dev/null || \
		echo "Warning: Could not find postgres.data"
	@echo "PGlite build complete"

# Build Go port binary
build-port:
	@echo "Building Go port binary..."
	@echo "This requires Go 1.21 or later"
	@cd pglited && $(MAKE) build-release && cp target/release/pglited ../priv/bin/pglited
	@echo "Go port build complete"

# Build the complete project
build: build-wasm build-port
	@echo "Building Elixir project..."
	mix deps.get
	mix compile

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf priv/pglite priv/bin
	mix clean
	@cd pglited && $(MAKE) clean 2>/dev/null || true
	@if [ -d "pglite" ]; then \
		cd pglite && pnpm clean 2>/dev/null || true; \
	fi

# Run tests
test:
	mix test
