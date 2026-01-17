/// PGlite Port - Wasmtime-based PostgreSQL runtime
///
/// Usage: pglite_port <data_dir> <tcp_port> <wasm_path> <prefix_dir> [options]
///
/// Arguments:
///   data_dir         - Directory for PostgreSQL data (will be created if missing)
///   tcp_port         - TCP port to listen on for PostgreSQL connections
///   wasm_path        - Path to the pglite.wasi binary
///   prefix_dir       - Directory containing pglite prefix files (share/postgresql/)
///
/// Options:
///   --pgdata-seed <path>    - Path to pre-initialized PGDATA tarball (pgdata_seed.tar.zst)
///   --multiplexer <mode>    - Connection multiplexer mode: none, queue (default: none)
///   --queue-size <n>        - Max queued queries for queue mode (default: 1000)
///   --query-timeout <ms>    - Query timeout in milliseconds (default: 30000)
///
/// Environment:
///   PGLITE_DEBUG=1   - Enable verbose debug output

use anyhow::{Context, Result};
use pglite_port::{
    bind_tcp_socket, multiplexer, MultiplexerConfig, MultiplexerMode, PgliteConfig, PgliteRuntime,
};
use serde_json::json;
use std::env;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

static SHUTDOWN: AtomicBool = AtomicBool::new(false);

fn is_debug() -> bool {
    env::var("PGLITE_DEBUG")
        .map(|v| v == "1" || v.to_lowercase() == "true")
        .unwrap_or(false)
}

macro_rules! debug_log {
    ($($arg:tt)*) => {
        if is_debug() {
            eprintln!($($arg)*);
        }
    };
}

fn setup_signal_handlers() {
    #[cfg(unix)]
    {
        use std::io::Read;

        std::thread::spawn(|| {
            let mut stdin = std::io::stdin();
            let mut buf = [0u8; 1];

            loop {
                match stdin.read(&mut buf) {
                    Ok(0) => {
                        debug_log!("[SIGNAL] stdin closed (parent died), shutting down");
                        SHUTDOWN.store(true, Ordering::SeqCst);
                        break;
                    }
                    Err(_) => {
                        debug_log!("[SIGNAL] stdin error, shutting down");
                        SHUTDOWN.store(true, Ordering::SeqCst);
                        break;
                    }
                    _ => {}
                }
            }
        });
    }
}

fn print_usage(program: &str) {
    eprintln!("Usage: {} <data_dir> <tcp_port> <wasm_path> <prefix_dir> [options]", program);
    eprintln!();
    eprintln!("Arguments:");
    eprintln!("  data_dir         - Directory for PostgreSQL data");
    eprintln!("  tcp_port         - TCP port for PostgreSQL connections");
    eprintln!("  wasm_path        - Path to pglite.wasi binary");
    eprintln!("  prefix_dir       - Directory containing pglite prefix files");
    eprintln!();
    eprintln!("Options:");
    eprintln!("  --pgdata-seed <path>    - Pre-initialized PGDATA tarball (faster startup)");
    eprintln!("  --multiplexer <mode>    - Connection multiplexer mode:");
    eprintln!("                            none  - Direct thread-per-connection (default)");
    eprintln!("                            queue - Query queue serialization");
    eprintln!("  --queue-size <n>        - Max queued queries (default: 1000)");
    eprintln!("  --query-timeout <ms>    - Query timeout in ms (default: 30000)");
    eprintln!();
    eprintln!("Environment:");
    eprintln!("  PGLITE_DEBUG=1          - Enable verbose debug output");
}

struct ParsedArgs {
    data_dir: PathBuf,
    tcp_port: u16,
    wasm_path: PathBuf,
    prefix_dir: PathBuf,
    pgdata_seed_path: Option<PathBuf>,
    multiplexer_config: MultiplexerConfig,
}

fn parse_args() -> Result<ParsedArgs> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 5 {
        print_usage(&args[0]);
        std::process::exit(1);
    }

    let data_dir = PathBuf::from(&args[1]);
    let tcp_port: u16 = args[2]
        .parse()
        .context("tcp_port must be a valid port number (1-65535)")?;
    let wasm_path = PathBuf::from(&args[3]);
    let prefix_dir = PathBuf::from(&args[4]);

    // Parse optional arguments
    let mut pgdata_seed_path: Option<PathBuf> = None;
    let mut multiplexer_config = MultiplexerConfig::default();

    let mut i = 5;
    while i < args.len() {
        match args[i].as_str() {
            "--pgdata-seed" => {
                i += 1;
                if i >= args.len() {
                    anyhow::bail!("--pgdata-seed requires a path argument");
                }
                pgdata_seed_path = Some(PathBuf::from(&args[i]));
            }
            "--multiplexer" => {
                i += 1;
                if i >= args.len() {
                    anyhow::bail!("--multiplexer requires a mode argument (none, queue)");
                }
                multiplexer_config.mode = MultiplexerMode::from_str(&args[i])
                    .ok_or_else(|| anyhow::anyhow!(
                        "Invalid multiplexer mode '{}'. Valid modes: none, queue",
                        args[i]
                    ))?;
            }
            "--queue-size" => {
                i += 1;
                if i >= args.len() {
                    anyhow::bail!("--queue-size requires a number argument");
                }
                multiplexer_config.max_queue_size = args[i]
                    .parse()
                    .context("--queue-size must be a positive integer")?;
            }
            "--query-timeout" => {
                i += 1;
                if i >= args.len() {
                    anyhow::bail!("--query-timeout requires a number argument");
                }
                multiplexer_config.query_timeout_ms = args[i]
                    .parse()
                    .context("--query-timeout must be a positive integer")?;
            }
            // Legacy: support positional pgdata_seed_path for backwards compatibility
            arg if !arg.starts_with("--") && pgdata_seed_path.is_none() => {
                pgdata_seed_path = Some(PathBuf::from(arg));
            }
            _ => {
                anyhow::bail!("Unknown argument: {}", args[i]);
            }
        }
        i += 1;
    }

    Ok(ParsedArgs {
        data_dir,
        tcp_port,
        wasm_path,
        prefix_dir,
        pgdata_seed_path,
        multiplexer_config,
    })
}

fn main() -> Result<()> {
    setup_signal_handlers();

    let parsed = match parse_args() {
        Ok(p) => p,
        Err(e) => {
            eprintln!("Error: {}", e);
            std::process::exit(1);
        }
    };

    debug_log!("=== PGlite Wasmtime Port ===");
    debug_log!("Data Directory: {:?}", parsed.data_dir);
    debug_log!("TCP Port: {}", parsed.tcp_port);
    debug_log!("WASM Path: {:?}", parsed.wasm_path);
    debug_log!("Prefix Directory: {:?}", parsed.prefix_dir);
    if let Some(ref sp) = parsed.pgdata_seed_path {
        debug_log!("PGDATA Seed: {:?}", sp);
    }
    debug_log!("Multiplexer Mode: {}", parsed.multiplexer_config.mode.name());
    if parsed.multiplexer_config.mode == MultiplexerMode::QueryQueue {
        debug_log!("  Queue Size: {}", parsed.multiplexer_config.max_queue_size);
        debug_log!("  Query Timeout: {}ms", parsed.multiplexer_config.query_timeout_ms);
    }
    debug_log!("Process ID: {}", std::process::id());

    let config = PgliteConfig {
        data_dir: parsed.data_dir,
        tcp_port: parsed.tcp_port,
        wasm_path: parsed.wasm_path,
        prefix_dir: parsed.prefix_dir,
        pgdata_seed_path: parsed.pgdata_seed_path.clone(),
    };

    debug_log!("\n=== Step 1: Creating Runtime ===");
    let mut runtime = match PgliteRuntime::new(config) {
        Ok(r) => {
            debug_log!("✓ Runtime created");
            debug_log!("  Data dir: {:?}", r.data_dir);
            r
        }
        Err(e) => {
            eprintln!("Failed to create runtime: {:?}", e);
            println!(
                "{}",
                json!({"id": "ready", "success": false, "error": format!("{:?}", e)})
            );
            std::process::exit(1);
        }
    };

    debug_log!("\n=== Step 2: Initializing PostgreSQL ===");
    if parsed.pgdata_seed_path.is_some() {
        debug_log!("  Using PGDATA seed (skipping initdb)");
    } else {
        debug_log!("  No PGDATA seed, running initdb...");
    }
    let init_result = runtime.init_postgres();

    match init_result {
        Ok(()) => {
            debug_log!("✓ PostgreSQL initialized");
        }
        Err(e) => {
            eprintln!("PostgreSQL initialization failed: {:?}", e);
            println!(
                "{}",
                json!({"id": "ready", "success": false, "error": format!("{:?}", e)})
            );
            std::process::exit(1);
        }
    }

    debug_log!("\n=== Step 3: Binding TCP Socket ===");
    let listener = match bind_tcp_socket(parsed.tcp_port) {
        Ok(l) => {
            debug_log!("✓ TCP socket bound to 127.0.0.1:{}", parsed.tcp_port);
            l
        }
        Err(e) => {
            eprintln!("Failed to bind TCP socket: {:?}", e);
            println!(
                "{}",
                json!({"id": "ready", "success": false, "error": format!("{:?}", e)})
            );
            std::process::exit(1);
        }
    };

    debug_log!("\n=== Step 4: Ready ===");
    println!(
        "{}",
        json!({
            "id": "ready",
            "success": true,
            "port": parsed.tcp_port,
            "multiplexer": parsed.multiplexer_config.mode.name()
        })
    );
    debug_log!("✓ Ready signal sent to Elixir");

    let runtime = Arc::new(runtime);

    debug_log!("\n=== Step 5: Accepting Connections ===");

    // Run the server with the configured multiplexer mode
    if let Err(e) = multiplexer::run_server(
        runtime.clone(),
        listener,
        parsed.multiplexer_config,
        &SHUTDOWN,
        is_debug(),
    ) {
        eprintln!("Server error: {:?}", e);
    }

    drop(runtime);
    debug_log!("[SHUTDOWN] Clean exit");
    Ok(())
}
