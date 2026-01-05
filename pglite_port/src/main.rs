/// PGlite Port - Wasmtime-based PostgreSQL runtime
///
/// Usage: pglite_port <data_dir> <tcp_port> <wasm_path> <prefix_dir> [pgdata_seed_path]
///
/// Arguments:
///   data_dir         - Directory for PostgreSQL data (will be created if missing)
///   tcp_port         - TCP port to listen on for PostgreSQL connections
///   wasm_path        - Path to the pglite.wasi binary
///   prefix_dir       - Directory containing pglite prefix files (share/postgresql/)
///   pgdata_seed_path - Optional: Path to pre-initialized PGDATA tarball (pgdata_seed.tar.zst)
///
/// Environment:
///   PGLITE_DEBUG=1   - Enable verbose debug output

use anyhow::{Context, Result};
use pglite_port::{bind_tcp_socket, handle_connection, PgliteConfig, PgliteRuntime};
use serde_json::json;
use std::env;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

static SHUTDOWN: AtomicBool = AtomicBool::new(false);

fn is_debug() -> bool {
    env::var("PGLITE_DEBUG").map(|v| v == "1" || v.to_lowercase() == "true").unwrap_or(false)
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

fn main() -> Result<()> {
    setup_signal_handlers();
    let args: Vec<String> = env::args().collect();

    if args.len() < 5 || args.len() > 6 {
        eprintln!("Usage: {} <data_dir> <tcp_port> <wasm_path> <prefix_dir> [pgdata_seed_path]", args[0]);
        eprintln!();
        eprintln!("Arguments:");
        eprintln!("  data_dir         - Directory for PostgreSQL data");
        eprintln!("  tcp_port         - TCP port for PostgreSQL connections");
        eprintln!("  wasm_path        - Path to pglite.wasi binary");
        eprintln!("  prefix_dir       - Directory containing pglite prefix files");
        eprintln!("  pgdata_seed_path - Optional: pre-initialized PGDATA tarball (faster startup)");
        std::process::exit(1);
    }

    let data_dir = PathBuf::from(&args[1]);
    let tcp_port: u16 = args[2]
        .parse()
        .context("tcp_port must be a valid port number (1-65535)")?;
    let wasm_path = PathBuf::from(&args[3]);
    let prefix_dir = PathBuf::from(&args[4]);
    let pgdata_seed_path = args.get(5).map(PathBuf::from);

    debug_log!("=== PGlite Wasmtime Port ===");
    debug_log!("Data Directory: {:?}", data_dir);
    debug_log!("TCP Port: {}", tcp_port);
    debug_log!("WASM Path: {:?}", wasm_path);
    debug_log!("Prefix Directory: {:?}", prefix_dir);
    if let Some(ref sp) = pgdata_seed_path {
        debug_log!("PGDATA Seed: {:?}", sp);
    }
    debug_log!("Process ID: {}", std::process::id());

    let config = PgliteConfig {
        data_dir,
        tcp_port,
        wasm_path,
        prefix_dir,
        pgdata_seed_path: pgdata_seed_path.clone(),
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
    if pgdata_seed_path.is_some() {
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
    println!(
        "{}",
        json!({"id": "ready", "success": true, "port": tcp_port})
    );
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
