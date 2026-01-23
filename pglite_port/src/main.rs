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
use pglite_port::{bind_tcp_socket, handle_connection, PgliteConfig, PgliteRuntime};
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
    wasm_path: PathBuf,
    prefix_dir: PathBuf,
    pgdata_seed_path: Option<PathBuf>,
    multiplexer_mode: Option<String>,
}

impl ParsedArgs {
    fn parse() -> Result<Self> {
        let args: Vec<String> = env::args().collect();

        if args.len() < 5 {
            Self::print_usage(&args[0]);
            std::process::exit(1);
        }

        let data_dir = PathBuf::from(&args[1]);
        let tcp_port: u16 = args[2]
            .parse()
            .context("tcp_port must be a valid port number (1-65535)")?;
        let wasm_path = PathBuf::from(&args[3]);
        let prefix_dir = PathBuf::from(&args[4]);

        let mut pgdata_seed_path: Option<PathBuf> = None;
        let mut multiplexer_mode: Option<String> = None;

        let mut i = 5;
        while i < args.len() {
            if args[i] == "--multiplexer" {
                if i + 1 < args.len() {
                    multiplexer_mode = Some(args[i + 1].clone());
                    i += 2;
                } else {
                    eprintln!("Error: --multiplexer requires a mode argument (e.g., queue)");
                    std::process::exit(1);
                }
            } else if pgdata_seed_path.is_none() && !args[i].starts_with("--") {
                pgdata_seed_path = Some(PathBuf::from(&args[i]));
                i += 1;
            } else {
                eprintln!("Unknown argument: {}", args[i]);
                std::process::exit(1);
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
        eprintln!("Usage: {} <data_dir> <tcp_port> <wasm_path> <prefix_dir> [pgdata_seed_path] [--multiplexer <mode>]", program_name);
        eprintln!();
        eprintln!("Arguments:");
        eprintln!("  data_dir         - Directory for PostgreSQL data");
        eprintln!("  tcp_port         - TCP port for PostgreSQL connections");
        eprintln!("  wasm_path        - Path to pglite.wasi binary");
        eprintln!("  prefix_dir       - Directory containing pglite prefix files");
        eprintln!("  pgdata_seed_path - Optional: pre-initialized PGDATA tarball (faster startup)");
        eprintln!();
        eprintln!("Options:");
        eprintln!("  --multiplexer <mode>  - Enable connection multiplexer (mode: queue)");
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

fn main() -> Result<()> {
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
    if has_pgdata_seed {
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
    let listener = match bind_tcp_socket(tcp_port) {
        Ok(l) => {
            debug_log!("✓ TCP socket bound to 127.0.0.1:{}", tcp_port);
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
    let ready_json = if let Some(ref mode) = multiplexer_mode {
        json!({"id": "ready", "success": true, "port": tcp_port, "multiplexer": mode})
    } else {
        json!({"id": "ready", "success": true, "port": tcp_port})
    };
    println!("{}", ready_json);
    debug_log!("✓ Ready signal sent to Elixir");

    let runtime = Arc::new(runtime);
    let mut connection_handles: Vec<std::thread::JoinHandle<()>> = Vec::new();

    debug_log!("\n=== Step 5: Accepting Connections ===");
    listener.set_nonblocking(true)?;

    loop {
        if SHUTDOWN.load(Ordering::SeqCst) {
            debug_log!("[SHUTDOWN] Received shutdown signal, exiting accept loop");
            break;
        }

        connection_handles.retain(|h| !h.is_finished());

        match listener.accept() {
            Ok((stream, addr)) => {
                debug_log!("New connection from {:?}", addr);

                let runtime_clone = Arc::clone(&runtime);
                let handle = std::thread::spawn(move || {
                    if let Err(e) = handle_connection(stream, runtime_clone) {
                        debug_log!("Connection error from {:?}: {:?}", addr, e);
                    } else {
                        debug_log!("Client {:?} disconnected", addr);
                    }
                });
                connection_handles.push(handle);
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                std::thread::sleep(Duration::from_millis(1));
            }
            Err(e) => {
                debug_log!("Accept error: {:?}", e);
            }
        }
    }

    drop(listener);

    debug_log!("[SHUTDOWN] Waiting for {} connection handlers to finish...", connection_handles.len());
    for handle in connection_handles {
        let _ = handle.join();
    }

    drop(runtime);
    debug_log!("[SHUTDOWN] Clean exit");
    Ok(())
}
