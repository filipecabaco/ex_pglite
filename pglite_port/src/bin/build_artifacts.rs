//! Unified build script for PGlite artifacts
//!
//! This creates all the artifacts needed for fast PGlite startup:
//! 1. Pre-compiled WASM module (.cwasm)
//! 2. Pre-initialized PGDATA seed with clean shutdown state
//!
//! The PGDATA seed is created by running PGlite in file mode, letting it
//! initialize completely, then capturing the database files after a clean
//! shutdown.
//!
//! Usage: build_artifacts <wasm_path> <prefix_dir> <output_dir>
//!
//! Example:
//!   cargo run --release --example build_artifacts -- \
//!     priv/pglite.wasi \
//!     priv/pglite_prefix \
//!     priv
//!
//! Output files:
//!   - <output_dir>/pglite.cwasm - Pre-compiled WASM module
//!   - <output_dir>/pgdata_seed.tar.zst - Pre-initialized PGDATA

use anyhow::{Context, Result};
use pglite_port::{PgliteConfig, PgliteRuntime};
use std::env;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::Instant;
use wasmtime::{Config, Engine, Module};

fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();

    if args.len() != 4 {
        eprintln!("Usage: {} <wasm_path> <prefix_dir> <output_dir>", args[0]);
        eprintln!();
        eprintln!("Creates all PGlite build artifacts for fast startup:");
        eprintln!("  - pglite.cwasm: Pre-compiled WASM module");
        eprintln!("  - pgdata_seed.tar.zst: Pre-initialized PGDATA with clean shutdown");
        eprintln!();
        eprintln!("Arguments:");
        eprintln!("  wasm_path  - Path to pglite.wasi binary");
        eprintln!("  prefix_dir - Directory containing pglite prefix files");
        eprintln!("  output_dir - Output directory for artifacts");
        std::process::exit(1);
    }

    let wasm_path = PathBuf::from(&args[1]);
    let prefix_dir = PathBuf::from(&args[2]);
    let output_dir = PathBuf::from(&args[3]);

    let cwasm_path = output_dir.join("pglite.cwasm");
    let seed_path = output_dir.join("pgdata_seed.tar.zst");

    eprintln!("=== PGlite Build Artifacts ===");
    eprintln!("WASM Path: {:?}", wasm_path);
    eprintln!("Prefix Directory: {:?}", prefix_dir);
    eprintln!("Output Directory: {:?}", output_dir);
    eprintln!();

    std::fs::create_dir_all(&output_dir)?;

    // Step 1: Precompile WASM to native code
    eprintln!("=== Step 1: Precompiling WASM to Native Code ===");
    let start = Instant::now();
    precompile_wasm(&wasm_path, &cwasm_path)?;
    eprintln!("✓ CWASM created in {:?}", start.elapsed());
    if let Ok(metadata) = std::fs::metadata(&cwasm_path) {
        eprintln!(
            "  Size: {:.2} MB",
            metadata.len() as f64 / (1024.0 * 1024.0)
        );
    }

    // Step 2: Create PGDATA seed with clean shutdown
    eprintln!("\n=== Step 2: Creating PGDATA Seed ===");
    let start = Instant::now();
    create_pgdata_seed(&cwasm_path, &prefix_dir, &seed_path)?;
    eprintln!("✓ PGDATA seed created in {:?}", start.elapsed());
    if let Ok(metadata) = std::fs::metadata(&seed_path) {
        eprintln!(
            "  Size: {:.2} MB",
            metadata.len() as f64 / (1024.0 * 1024.0)
        );
    }

    eprintln!("\n=== Build Complete ===");
    eprintln!("Artifacts:");
    eprintln!("  - {:?}", cwasm_path);
    eprintln!("  - {:?}", seed_path);

    Ok(())
}

fn precompile_wasm(input: &Path, output: &Path) -> Result<()> {
    let mut config = Config::new();
    config.memory_init_cow(true);
    config.table_lazy_init(true);
    config.memory_guaranteed_dense_image_size(64 * 1024 * 1024);

    let engine = Engine::new(&config)?;

    eprintln!("  Loading WASM module...");
    let module = Module::from_file(&engine, input).context("Failed to load WASM module")?;

    eprintln!("  Serializing to native code...");
    let bytes = module.serialize().context("Failed to serialize module")?;

    std::fs::write(output, &bytes).context("Failed to write cwasm file")?;

    Ok(())
}

fn create_pgdata_seed(cwasm_path: &Path, prefix_dir: &Path, output: &Path) -> Result<()> {
    // Create a temporary directory for PGDATA (file mode, not memory mode)
    let pgdata_dir = std::env::temp_dir().join(format!("pglite_build_seed_{}", std::process::id()));
    std::fs::create_dir_all(&pgdata_dir)?;

    eprintln!("  PGDATA location: {:?}", pgdata_dir);

    // Derive wasm_path from cwasm_path
    let wasm_path = cwasm_path.with_extension("wasi");

    let config = PgliteConfig {
        data_dir: pgdata_dir.clone(),
        tcp_port: 0,
        wasm_path: Some(wasm_path.clone()),
        prefix_dir: Some(prefix_dir.to_path_buf()),
        pgdata_seed_path: None,
    };

    eprintln!("  Creating runtime...");
    let mut runtime = PgliteRuntime::new(config).context("Failed to create runtime")?;

    eprintln!("  Running PGlite initdb (this takes ~10s)...");
    runtime
        .init_postgres()
        .context("Failed to initialize PostgreSQL")?;

    // Perform a clean PostgreSQL shutdown with checkpoint
    // This ensures the WAL is flushed and the database is in a consistent state
    eprintln!("  Running PostgreSQL shutdown with checkpoint...");
    runtime
        .shutdown()
        .context("Failed to shutdown PostgreSQL cleanly")?;

    // Drop the runtime explicitly to release resources
    drop(runtime);

    // Give the OS a moment to flush any pending writes
    std::thread::sleep(std::time::Duration::from_millis(100));

    // Verify PGDATA exists and has content
    if !pgdata_dir.exists() || std::fs::read_dir(&pgdata_dir)?.next().is_none() {
        anyhow::bail!("PGDATA directory is empty after initialization");
    }

    eprintln!("  Creating tarball...");
    let tar_data = create_tarball(&pgdata_dir)?;

    eprintln!("  Compressing with zstd...");
    let compressed =
        zstd::encode_all(tar_data.as_slice(), 3).context("Failed to compress tarball")?;

    std::fs::write(output, &compressed).context("Failed to write output file")?;

    // Cleanup
    let _ = std::fs::remove_dir_all(&pgdata_dir);

    Ok(())
}

fn create_tarball(dir: &Path) -> Result<Vec<u8>> {
    let mut tar_data = Vec::new();

    {
        let mut builder = tar::Builder::new(&mut tar_data);
        add_dir_to_tar(&mut builder, dir, Path::new(""))?;
        builder.finish()?;
    }

    Ok(tar_data)
}

fn add_dir_to_tar<W: Write>(
    builder: &mut tar::Builder<W>,
    base_dir: &Path,
    relative_path: &Path,
) -> Result<()> {
    let current_dir = base_dir.join(relative_path);

    for entry in std::fs::read_dir(&current_dir)? {
        let entry = entry?;
        let path = entry.path();
        let name = entry.file_name();
        let entry_relative = relative_path.join(&name);

        if path.is_dir() {
            let mut header = tar::Header::new_gnu();
            header.set_path(&entry_relative)?;
            header.set_size(0);
            header.set_mode(0o755);
            header.set_entry_type(tar::EntryType::Directory);
            header.set_cksum();
            builder.append(&header, std::io::empty())?;

            add_dir_to_tar(builder, base_dir, &entry_relative)?;
        } else {
            let data = std::fs::read(&path)?;
            let mut header = tar::Header::new_gnu();
            header.set_path(&entry_relative)?;
            header.set_size(data.len() as u64);
            header.set_mode(0o644);
            header.set_entry_type(tar::EntryType::Regular);
            header.set_cksum();
            builder.append(&header, data.as_slice())?;
        }
    }

    Ok(())
}
