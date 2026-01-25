# ex_pglite

An Elixir library that runs PostgreSQL in-process using PGlite (PostgreSQL compiled to WebAssembly). No external PostgreSQL server required.

## Features

- **Zero external dependencies** - PostgreSQL runs entirely in-process via WebAssembly
- **Standard PostgreSQL wire protocol** - Works with Postgrex and any PostgreSQL client
- **Memory and persistent modes** - Choose between ephemeral or persistent storage
- **Multiple instances** - Run isolated PostgreSQL instances on different ports
- **Fast startup** - Pre-compiled WASM and PGDATA seeds reduce initialization time by 50-75%
- **Full PostgreSQL compatibility** - Supports transactions, DDL, DML, JSONB, and complex types

## How It Works

1. A Rust binary (`pglite_port`) loads PostgreSQL WASM via Wasmtime
2. PostgreSQL runs in-process and exposes a TCP socket on localhost
3. Postgrex connects using the standard PostgreSQL wire protocol

## Installation

Add to your `mix.exs`:

```elixir
def deps do
  [{:ex_pglite, "~> 0.1.0"}]
end
```

Requires Rust 1.70+ to build the native binary during `mix compile`.

## Usage

```elixir
# Start PGlite
{:ok, pglite} = Pglite.start_link()

# Connect with Postgrex
{:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

# Run queries
{:ok, result} = Postgrex.query(conn, "SELECT 1", [])
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `memory` | `true` | Use in-memory storage (false for persistent) |
| `data_dir` | random temp dir | Directory for persistent database files |
| `tcp_port` | `54321` | TCP port for PostgreSQL connection |
| `database` | `"postgres"` | Database name |
| `username` | `"postgres"` | Username |
| `password` | `"password"` | Password |
| `startup_timeout` | `60000` | Startup timeout in ms |
| `pgdata_seed_path` | auto-detected | Pre-initialized PGDATA for faster startup |

The library automatically uses a pre-built PGDATA seed from `priv/pgdata_seed.tar.zst` when available, reducing startup time by ~50-75%.

## Multiple Instances

Each instance needs a unique TCP port:

```elixir
{:ok, db1} = Pglite.start_link(tcp_port: 54321)
{:ok, db2} = Pglite.start_link(tcp_port: 54322)
```

## Testing

```elixir
defmodule MyTest do
  use ExUnit.Case

  setup do
    {:ok, pglite} = Pglite.start_link()
    {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
    on_exit(fn -> GenServer.stop(conn); GenServer.stop(pglite) end)
    %{conn: conn}
  end

  test "queries work", %{conn: conn} do
    {:ok, result} = Postgrex.query(conn, "SELECT 1", [])
    assert result.rows == [[1]]
  end
end
```

## Aligning with CI checks locally

CI for this project is defined in `.github/workflows/elixir-ci.yml`, which installs Elixir 1.15.3 / OTP 26.3, the stable Rust toolchain, and then runs Credo, Dialyzer, and `mix test` inside `MIX_ENV=test`. To reproduce those steps on your machine:

1. **Set up the toolchain** – install `elixir`/`otp` at the versions above (via `asdf`, `asdf-erlang`, Homebrew, etc.) and use `rustup toolchain install stable` so the Rust side matches the GitHub Actions job.
2. **Bootstrap Mix**
   ```bash
   mix local.hex --force
   mix local.rebar --force
   mix deps.get
   mix deps.compile
   ```
3. **Run the checks**
   ```bash
   MIX_ENV=test mix credo --strict
   MIX_ENV=test mix dialyzer --halt-exit-status
   MIX_ENV=test mix test
   ```

### Caching considerations

To keep the local runs fast and in sync with the workflow, reuse the same directories that are cached on CI:

- `assets/pglite_npm` (the workflow caches generated frontend assets keyed by `pglited/Cargo.lock`)
- Mix artifacts: `_build`, `deps`, `~/.hex`, and `~/.cache/rebar3`
- Rust artifacts: `pglited/target`, `~/.cargo/registry`, and `~/.cargo/git`

Avoid deleting those folders between runs unless you intentionally want a clean slate. When packages or `Cargo.lock`/`mix.lock` change, rerun the bootstrap commands above so the cache entries stay valid.

If you prefer, wrap the commands above in a script so you can quickly rerun Credo + Dialyzer + tests just like the CI job does. Always run them from the repository root so the hashes used by Actions (`mix.lock`, `pglited/Cargo.lock`) stay consistent.

## Building from Source

```bash
git clone https://github.com/filipecabaco/ex_pglite.git
cd ex_pglite
make build
mix test
```

### Building Rust Artifacts

The Rust port builds all tools with a single command:

```bash
cd pglite_port
cargo build --release

# Create pre-compiled WASM and PGDATA seed (faster startup)
./target/release/build_artifacts ../priv/pglite.wasi ../priv/pglite_prefix ../priv

# Copy binaries to priv
cp target/release/pglite_port target/release/build_artifacts ../priv/bin/
```

This creates:
- `priv/pglite.cwasm` - Pre-compiled native WASM module
- `priv/pgdata_seed.tar.zst` - Pre-initialized PostgreSQL data directory

## Compatibility

- **Elixir**: 1.14+
- **Rust**: 1.70+ (for building from source)
- **Platforms**: macOS (arm64, x86_64), Linux (x86_64)

## Limitations

- **Single-process model** - Each PGlite instance runs in a single OS process; no multi-process parallelism
- **No extensions** - PostgreSQL extensions are not supported in the WASM build
- **Localhost only** - TCP socket binds to 127.0.0.1; not suitable for network-accessible databases
- **Performance** - Suitable for development, testing, and lightweight workloads; not for production databases

## Debug Mode

Set `PGLITE_DEBUG=1` to enable verbose logging from the Rust runtime:

```bash
PGLITE_DEBUG=1 mix test
```

## Benchmarks

Extreme profile (ops target 2000/s) for 5 minutes on simple schema (1000 rows), 1 instance:

| Persistence | Pool size | Ops/s | P95 latency (ms) |
|-------------|-----------|-------|------------------|
| memory      | 1         | 369.0 | 18.61            |
| memory      | 20        | 350.1 | 16.61            |
| file        | 1         | 369.5 | 15.87            |
| file        | 20        | 373.1 | 16.61            |

## License

MIT
