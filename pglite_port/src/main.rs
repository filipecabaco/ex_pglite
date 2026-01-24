//! PGlite Port - Wasmtime-based PostgreSQL runtime
//!
//! Usage: pglite_port <data_dir> <tcp_port> <wasm_path> <prefix_dir> [pgdata_seed_path]
//!
//! Arguments:
//!   data_dir         - Directory for PostgreSQL data (will be created if missing)
//!   tcp_port         - TCP port to listen on for PostgreSQL connections
//!   wasm_path        - Path to the pglite.wasi binary
//!   prefix_dir       - Directory containing pglite prefix files (share/postgresql/)
//!   pgdata_seed_path - Optional: Path to pre-initialized PGDATA tarball (pgdata_seed.tar.zst)
//!
//! Environment:
//!   PGLITE_DEBUG=1   - Enable verbose debug output

use anyhow::{Context, Result};
use once_cell::sync::Lazy;
use pglite_port::{AsyncPgliteExecutor, PgliteConfig, PgliteRuntime};
use serde_json::json;
use std::env;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

static SHUTDOWN: AtomicBool = AtomicBool::new(false);

static DEBUG_ENABLED: Lazy<bool> = Lazy::new(|| {
    env::var("PGLITE_DEBUG")
        .map(|v| v == "1" || v.to_lowercase() == "true")
        .unwrap_or(false)
});

macro_rules! debug_log {
    ($($arg:tt)*) => {
        if *DEBUG_ENABLED {
            eprintln!($($arg)*);
        }
    };
}

struct ParsedArgs {
    data_dir: PathBuf,
    tcp_port: u16,
    wasm_path: Option<PathBuf>,
    prefix_dir: Option<PathBuf>,
    pgdata_seed_path: Option<PathBuf>,
    multiplexer_mode: Option<String>,
}

impl ParsedArgs {
    fn parse() -> Result<Self> {
        let args: Vec<String> = env::args().collect();

        if args.len() < 3 {
            Self::print_usage(&args[0]);
            std::process::exit(1);
        }

        let data_dir = PathBuf::from(&args[1]);
        let tcp_port: u16 = args[2]
            .parse()
            .context("tcp_port must be a valid port number (1-65535)")?;

        let mut wasm_path: Option<PathBuf> = None;
        let mut prefix_dir: Option<PathBuf> = None;
        let mut pgdata_seed_path: Option<PathBuf> = None;
        let mut multiplexer_mode: Option<String> = None;

        let mut i = 3;
        while i < args.len() {
            match args[i].as_str() {
                "--wasm" | "--wasm-path" => {
                    if i + 1 < args.len() {
                        wasm_path = Some(PathBuf::from(&args[i + 1]));
                        i += 2;
                    } else {
                        eprintln!("Error: --wasm requires a path argument");
                        std::process::exit(1);
                    }
                }
                "--prefix" | "--prefix-dir" => {
                    if i + 1 < args.len() {
                        prefix_dir = Some(PathBuf::from(&args[i + 1]));
                        i += 2;
                    } else {
                        eprintln!("Error: --prefix requires a path argument");
                        std::process::exit(1);
                    }
                }
                "--pgdata-seed" => {
                    if i + 1 < args.len() {
                        pgdata_seed_path = Some(PathBuf::from(&args[i + 1]));
                        i += 2;
                    } else {
                        eprintln!("Error: --pgdata-seed requires a path argument");
                        std::process::exit(1);
                    }
                }
                "--multiplexer" => {
                    if i + 1 < args.len() {
                        multiplexer_mode = Some(args[i + 1].clone());
                        i += 2;
                    } else {
                        eprintln!("Error: --multiplexer requires a mode argument (e.g., queue)");
                        std::process::exit(1);
                    }
                }
                arg if arg.starts_with("--") => {
                    eprintln!("Unknown argument: {}", arg);
                    std::process::exit(1);
                }
                _ => {
                    if wasm_path.is_none() {
                        wasm_path = Some(PathBuf::from(&args[i]));
                        i += 1;
                    } else if prefix_dir.is_none() {
                        prefix_dir = Some(PathBuf::from(&args[i]));
                        i += 1;
                    } else if pgdata_seed_path.is_none() {
                        pgdata_seed_path = Some(PathBuf::from(&args[i]));
                        i += 1;
                    } else {
                        eprintln!("Unknown argument: {}", args[i]);
                        std::process::exit(1);
                    }
                }
            }
        }

        Ok(Self {
            data_dir,
            tcp_port,
            wasm_path,
            prefix_dir,
            pgdata_seed_path,
            multiplexer_mode,
        })
    }

    fn print_usage(program_name: &str) {
        eprintln!("Usage: {} <data_dir> <tcp_port> [wasm_path] [prefix_dir] [pgdata_seed_path] [--multiplexer <mode>]", program_name);
        eprintln!();
        eprintln!("Arguments:");
        eprintln!("  data_dir         - Directory for PostgreSQL data");
        eprintln!("  tcp_port         - TCP port for PostgreSQL connections");
        eprintln!("  wasm_path        - Optional: Path to pglite.wasi binary (embedded if omitted)");
        eprintln!("  prefix_dir       - Optional: Directory containing pglite prefix files (embedded if omitted)");
        eprintln!("  pgdata_seed_path - Optional: Pre-initialized PGDATA tarball (faster startup)");
        eprintln!();
        eprintln!("Options:");
        eprintln!("  --wasm <path>           - Path to pglite.wasi binary");
        eprintln!("  --prefix <path>          - Directory containing pglite prefix files");
        eprintln!("  --pgdata-seed <path>     - Path to pre-initialized PGDATA tarball");
        eprintln!("  --multiplexer <mode>      - Enable connection multiplexer (mode: queue)");
        eprintln!();
        eprintln!("Examples:");
        eprintln!("  {} memory:// 5432", program_name);
        eprintln!("  {} /tmp/db 5432 /path/to/pglite.wasi /path/to/prefix", program_name);
    }

    fn into_config(self) -> PgliteConfig {
        PgliteConfig {
            data_dir: self.data_dir,
            tcp_port: self.tcp_port,
            wasm_path: self.wasm_path,
            prefix_dir: self.prefix_dir,
            pgdata_seed_path: self.pgdata_seed_path,
        }
    }
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

#[tokio::main]
async fn main() -> Result<()> {
    setup_signal_handlers();

    let parsed_args = ParsedArgs::parse()?;

    debug_log!("=== PGlite Wasmtime Port ===");
    debug_log!("Data Directory: {:?}", parsed_args.data_dir);
    debug_log!("TCP Port: {}", parsed_args.tcp_port);
    debug_log!("WASM Path: {:?}", parsed_args.wasm_path);
    debug_log!("Prefix Directory: {:?}", parsed_args.prefix_dir);
    if let Some(ref sp) = parsed_args.pgdata_seed_path {
        debug_log!("PGDATA Seed: {:?}", sp);
    }
    if let Some(ref mode) = parsed_args.multiplexer_mode {
        debug_log!("Multiplexer Mode: {}", mode);
    }
    debug_log!("Process ID: {}", std::process::id());

    let tcp_port = parsed_args.tcp_port;
    let has_pgdata_seed = parsed_args.pgdata_seed_path.is_some();
    let multiplexer_mode = parsed_args.multiplexer_mode.clone();
    let config = parsed_args.into_config();

    debug_log!("\n=== Step 1: Creating Runtime ===");

    let runtime = tokio::task::spawn_blocking(move || -> Result<PgliteRuntime> {
        let mut runtime = PgliteRuntime::new(config)?;

        debug_log!("✓ Runtime created");
        debug_log!("  Data dir: {:?}", runtime.data_dir);

        debug_log!("\n=== Step 2: Initializing PostgreSQL ===");
        if has_pgdata_seed {
            debug_log!("  Using PGDATA seed (skipping initdb)");
        } else {
            debug_log!("  No PGDATA seed, running initdb...");
        }

        runtime.init_postgres()?;
        debug_log!("✓ PostgreSQL initialized");

        Ok(runtime)
    }).await;

    let runtime = match runtime {
        Ok(Ok(r)) => r,
        Ok(Err(e)) => {
            eprintln!("PostgreSQL initialization failed: {:?}", e);
            println!(
                "{}",
                json!({"id": "ready", "success": false, "error": format!("{:?}", e)})
            );
            std::process::exit(1);
        }
        Err(e) => {
            eprintln!("Task join failed: {:?}", e);
            println!(
                "{}",
                json!({"id": "ready", "success": false, "error": format!("{:?}", e)})
            );
            std::process::exit(1);
        }
    };

    debug_log!("\n=== Step 3: Preparing TCP Socket ===");
    debug_log!("  Will bind to 127.0.0.1:{}", tcp_port);

    debug_log!("\n=== Step 4: Ready ===");
    let ready_json = if let Some(ref mode) = multiplexer_mode {
        json!({"id": "ready", "success": true, "port": tcp_port, "multiplexer": mode})
    } else {
        json!({"id": "ready", "success": true, "port": tcp_port})
    };
    println!("{}", ready_json);
    debug_log!("✓ Ready signal sent to Elixir");

    let runtime = Arc::new(runtime);
    let executor = Arc::new(AsyncPgliteExecutor::new(Arc::clone(&runtime)));

    debug_log!("\n=== Step 5: Accepting Connections ===");

    let tokio_listener = tokio::net::TcpListener::bind(("127.0.0.1", tcp_port))
        .await
        .context("Failed to bind Tokio TCP listener")?;

    debug_log!("✓ Tokio TCP listener bound to 127.0.0.1:{}", tcp_port);

    loop {
        if SHUTDOWN.load(Ordering::SeqCst) {
            debug_log!("[SHUTDOWN] Received shutdown signal, exiting accept loop");
            break;
        }

        tokio::select! {
            biased;

            result = tokio_listener.accept() => {
                match result {
                    Ok((stream, addr)) => {
                        debug_log!("New connection from {:?}", addr);

                        let executor_clone = Arc::clone(&executor);

                        tokio::spawn(async move {
                            if let Err(e) = pglite_port::handle_connection_async(stream, executor_clone).await {
                                debug_log!("Connection error from {:?}: {:?}", addr, e);
                            } else {
                                debug_log!("Client {:?} disconnected", addr);
                            }
                        });
                    }
                    Err(e) => {
                        debug_log!("Accept error: {:?}", e);
                    }
                }
            }

            _ = tokio::time::sleep(Duration::from_millis(100)) => {
                continue;
            }
        }
    }

    drop(runtime);
    debug_log!("[SHUTDOWN] Clean exit");
    Ok(())
}
