use anyhow::Context;
use once_cell::sync::Lazy;
use std::io::Cursor;
use std::path::PathBuf;
use std::sync::Mutex;

/// Raw WASM binary (uncompiled). Reserved for potential future use where
/// on-the-fly compilation is needed. Currently we use PGLITE_CWASM for
/// faster startup via pre-compiled native code.
#[allow(dead_code)]
pub static PGLITE_WASM: &[u8] = include_bytes!("../assets/pglite.wasi");
pub static PGLITE_CWASM: &[u8] = include_bytes!("../assets/pglite.cwasm");
pub static PGDATA_SEED: &[u8] = include_bytes!("../assets/pgdata_seed.tar.zst");
pub static PREFIX_ARCHIVE: &[u8] = include_bytes!("../assets/prefix.tar.zst");

struct PrefixDir {
    path: PathBuf,
    cleanup: bool,
}

impl Drop for PrefixDir {
    fn drop(&mut self) {
        if self.cleanup {
            if let Err(e) = std::fs::remove_dir_all(&self.path) {
                eprintln!(
                    "[WARNING] Failed to clean up prefix dir {:?}: {}",
                    self.path, e
                );
            }
        }
    }
}

static PREFIX_DIR: Lazy<Mutex<Option<PrefixDir>>> = Lazy::new(|| Mutex::new(None));
static PGDATA_SEED_PATH: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

pub fn ensure_prefix_dir() -> anyhow::Result<PathBuf> {
    let mut guard = PREFIX_DIR.lock().unwrap();

    if let Some(ref prefix_dir) = *guard {
        return Ok(prefix_dir.path.clone());
    }

    let temp = std::env::temp_dir().join(format!("pglite_prefix_{}", std::process::id()));
    std::fs::create_dir_all(&temp)?;

    eprintln!("[ASSETS] Extracting prefix to {:?}", temp);

    let decoder = zstd::stream::Decoder::new(Cursor::new(PREFIX_ARCHIVE))
        .context("Failed to create zstd decoder for prefix archive")?;
    let mut archive = tar::Archive::new(decoder);

    archive
        .unpack(&temp)
        .context("Failed to unpack prefix archive")?;

    let prefix = PrefixDir {
        path: temp,
        cleanup: true,
    };

    let path = prefix.path.clone();
    *guard = Some(prefix);
    Ok(path)
}

pub fn cleanup_prefix_dir() {
    cleanup_pgdata_seed();
    let mut guard = PREFIX_DIR.lock().unwrap();
    *guard = None;
}

pub fn get_pgdata_seed_path() -> anyhow::Result<Option<PathBuf>> {
    let mut guard = PGDATA_SEED_PATH.lock().unwrap();

    if let Some(ref path) = *guard {
        return Ok(Some(path.clone()));
    }

    let temp = std::env::temp_dir().join(format!(
        "pgdata_seed_{}_{}.tar.zst",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    ));

    std::fs::write(&temp, PGDATA_SEED).context("Failed to write pgdata_seed")?;

    eprintln!("[ASSETS] Extracted pgdata_seed to {:?}", temp);

    *guard = Some(temp.clone());
    Ok(Some(temp))
}

pub fn cleanup_pgdata_seed() {
    let mut guard = PGDATA_SEED_PATH.lock().unwrap();
    *guard = None;
}
