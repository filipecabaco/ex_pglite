use anyhow::{Context, Result};
mod assets;
use assets::{ensure_prefix_dir, cleanup_prefix_dir, get_pgdata_seed_path};
use once_cell::sync::Lazy;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use tokio::sync::{mpsc, oneshot, Notify, Semaphore};
use wasmtime::{Config, Engine, Linker, Memory, Module, Store, Val};
use wasmtime_wasi::p1::WasiP1Ctx;
use wasmtime_wasi::{DirPerms, FilePerms, WasiCtxBuilder};

static WASM_SEMAPHORE: Lazy<Semaphore> = Lazy::new(|| Semaphore::const_new(1));

const MAX_RESPONSE_POLL_ITERATIONS: u8 = 11;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QueryPriority {
    High,   // Transaction control (COMMIT, ROLLBACK, END, ABORT) and in-transaction queries
    Normal, // Regular queries
}

/// Detects query priority from PostgreSQL wire protocol data.
/// High priority is assigned to transaction control commands (COMMIT, ROLLBACK, etc.)
/// which should be processed first to release transaction locks quickly.
fn detect_priority(data: &[u8]) -> QueryPriority {
    // Simple Query protocol: 'Q' + length (4 bytes) + query string (null-terminated)
    if data.len() > 5 && data[0] == b'Q' {
        // Find the null terminator to get the actual query string
        let query_bytes = &data[5..];
        let query_end = query_bytes.iter().position(|&b| b == 0).unwrap_or(query_bytes.len());

        if let Ok(sql) = std::str::from_utf8(&query_bytes[..query_end]) {
            if is_high_priority_command(sql) {
                return QueryPriority::High;
            }
        }
    }

    // Extended Query protocol: Parse message ('P')
    // Parse message: 'P' + length + statement_name (null-term) + query (null-term) + param_count
    if data.len() > 5 && data[0] == b'P' {
        // Skip statement name (null-terminated)
        if let Some(name_end) = data[5..].iter().position(|&b| b == 0) {
            let query_start = 5 + name_end + 1;
            if query_start < data.len() {
                let query_bytes = &data[query_start..];
                let query_end = query_bytes.iter().position(|&b| b == 0).unwrap_or(query_bytes.len());

                if let Ok(sql) = std::str::from_utf8(&query_bytes[..query_end]) {
                    if is_high_priority_command(sql) {
                        return QueryPriority::High;
                    }
                }
            }
        }
    }

    QueryPriority::Normal
}

fn is_high_priority_command(sql: &str) -> bool {
    let trimmed = sql.trim();
    let first_word = trimmed
        .split(|c: char| c.is_whitespace() || c == ';')
        .next()
        .unwrap_or("");

    let upper = first_word.to_uppercase();

    matches!(
        upper.as_str(),
        "COMMIT" | "ROLLBACK" | "END" | "ABORT" | "SAVEPOINT" | "RELEASE"
    )
}

struct WireMessage<'a> {
    msg_type: u8,
    payload: &'a [u8],
}

struct WireMessageIter<'a> {
    data: &'a [u8],
    offset: usize,
}

impl<'a> WireMessageIter<'a> {
    fn new(data: &'a [u8]) -> Self {
        Self { data, offset: 0 }
    }
}

impl<'a> Iterator for WireMessageIter<'a> {
    type Item = WireMessage<'a>;

    fn next(&mut self) -> Option<Self::Item> {
        if self.offset + 5 > self.data.len() {
            return None;
        }
        let msg_type = self.data[self.offset];
        let msg_len = u32::from_be_bytes([
            self.data[self.offset + 1],
            self.data[self.offset + 2],
            self.data[self.offset + 3],
            self.data[self.offset + 4],
        ]) as usize;

        let payload_start = self.offset + 5;
        let payload_end = self.offset + 1 + msg_len;
        if payload_end > self.data.len() {
            return None;
        }

        let payload = &self.data[payload_start..payload_end];
        self.offset = payload_end;

        Some(WireMessage { msg_type, payload })
    }
}

struct ErrorPattern {
    function_patterns: &'static [&'static str],
    sql_code: &'static str,
    message: &'static str,
}

const ERROR_PATTERNS: &[ErrorPattern] = &[
    // Class 42 - Syntax Error or Access Rule Violation
    ErrorPattern {
        function_patterns: &[
            "parserOpenTable",
            "addRangeTableEntry",
            "RangeVarGetRelid",
            "relation_openrv",
        ],
        sql_code: "42P01",
        message: "relation does not exist",
    },
    ErrorPattern {
        function_patterns: &["ParseFuncOrColumn", "LookupFuncName", "LookupFuncWithArgs"],
        sql_code: "42883",
        message: "function does not exist",
    },
    ErrorPattern {
        function_patterns: &["transformColumnRef", "colNameToVar", "errorMissingColumn"],
        sql_code: "42703",
        message: "column does not exist",
    },
    ErrorPattern {
        function_patterns: &["scanner_yyerror", "base_yyerror", "syntax_error"],
        sql_code: "42601",
        message: "syntax error",
    },
    ErrorPattern {
        function_patterns: &["aclcheck", "permission", "pg_aclcheck"],
        sql_code: "42501",
        message: "permission denied",
    },
    ErrorPattern {
        function_patterns: &["LookupTypeName", "typenameType", "TypeNameToString"],
        sql_code: "42704",
        message: "undefined object",
    },
    ErrorPattern {
        function_patterns: &[
            "LookupOperName",
            "LookupOperWithArgs",
            "oper_select_candidate",
        ],
        sql_code: "42883",
        message: "operator does not exist",
    },
    ErrorPattern {
        function_patterns: &["errorMissingRTE", "errorConflictingDefElem"],
        sql_code: "42P01",
        message: "undefined table",
    },
    ErrorPattern {
        function_patterns: &["transformExpr", "coerce_type", "coerce_to_target_type"],
        sql_code: "42846",
        message: "cannot coerce",
    },
    ErrorPattern {
        function_patterns: &["RI_FKey_check", "ri_Check_Pk_Match"],
        sql_code: "23503",
        message: "foreign key violation",
    },
    // Class 23 - Integrity Constraint Violation
    ErrorPattern {
        function_patterns: &["ExecConstraints", "_bt_check_unique", "unique_key_recheck"],
        sql_code: "23505",
        message: "unique constraint violation",
    },
    ErrorPattern {
        function_patterns: &["ExecRelCheck", "ExecPartitionCheck", "domain_check_input"],
        sql_code: "23514",
        message: "check constraint violation",
    },
    ErrorPattern {
        function_patterns: &["ExecCheckIndexConstraints", "check_exclusion_constraint"],
        sql_code: "23P01",
        message: "exclusion constraint violation",
    },
    ErrorPattern {
        function_patterns: &["ri_ReportViolation", "RI_FKey_noaction", "RI_FKey_restrict"],
        sql_code: "23503",
        message: "foreign key violation",
    },
    ErrorPattern {
        function_patterns: &["not_null_violation", "ExecConstraints"],
        sql_code: "23502",
        message: "not null violation",
    },
    ErrorPattern {
        function_patterns: &["ExecInsert", "ExecUpdate", "ExecDelete"],
        sql_code: "23000",
        message: "integrity constraint violation",
    },
    // Class 22 - Data Exception
    ErrorPattern {
        function_patterns: &["division_by_zero", "int4div", "int8div", "float8div"],
        sql_code: "22012",
        message: "division by zero",
    },
    ErrorPattern {
        function_patterns: &["numeric_overflow", "overflow", "int4mul", "int8mul"],
        sql_code: "22003",
        message: "numeric value out of range",
    },
    ErrorPattern {
        function_patterns: &["DateTimeParseError", "datetime_field_overflow"],
        sql_code: "22008",
        message: "datetime field overflow",
    },
    ErrorPattern {
        function_patterns: &["invalid_text_representation", "pg_strtoint"],
        sql_code: "22P02",
        message: "invalid text representation",
    },
    ErrorPattern {
        function_patterns: &["string_data_right_truncation", "varchar"],
        sql_code: "22001",
        message: "string data right truncation",
    },
    // Class 3D - Invalid Catalog Name
    ErrorPattern {
        function_patterns: &["get_database_oid", "GetDatabasePath"],
        sql_code: "3D000",
        message: "invalid catalog name",
    },
    // Class 3F - Invalid Schema Name
    ErrorPattern {
        function_patterns: &["LookupNamespace", "get_namespace_oid", "schema"],
        sql_code: "3F000",
        message: "invalid schema name",
    },
    // Class 40 - Transaction Rollback
    ErrorPattern {
        function_patterns: &["deadlock_detected", "DeadLockReport", "CheckDeadLock"],
        sql_code: "40P01",
        message: "deadlock detected",
    },
    ErrorPattern {
        function_patterns: &["serialization_failure", "OnConflict"],
        sql_code: "40001",
        message: "serialization failure",
    },
    // Class 53 - Insufficient Resources
    ErrorPattern {
        function_patterns: &["out_of_memory", "MemoryContextAlloc"],
        sql_code: "53200",
        message: "out of memory",
    },
    ErrorPattern {
        function_patterns: &["disk_full", "FileWrite"],
        sql_code: "53100",
        message: "disk full",
    },
    // Class 57 - Operator Intervention
    ErrorPattern {
        function_patterns: &["query_canceled", "cancel"],
        sql_code: "57014",
        message: "query canceled",
    },
    // Class 54 - Program Limit Exceeded
    ErrorPattern {
        function_patterns: &["too_many_columns", "MaxTupleAttributeNumber"],
        sql_code: "54011",
        message: "too many columns",
    },
    ErrorPattern {
        function_patterns: &["statement_too_complex", "expression_too_deep"],
        sql_code: "54001",
        message: "statement too complex",
    },
];

fn detect_error_from_trap(trap_error: &str) -> (&'static str, Option<&'static str>) {
    for pattern in ERROR_PATTERNS {
        if pattern
            .function_patterns
            .iter()
            .any(|p| trap_error.contains(p))
        {
            return (pattern.sql_code, Some(pattern.message));
        }
    }
    ("XX000", None)
}

fn copy_dir_recursive(src: &PathBuf, dst: &PathBuf) -> Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let path = entry.path();
        let dest_path = dst.join(entry.file_name());
        if path.is_dir() {
            copy_dir_recursive(&path, &dest_path)?;
        } else {
            std::fs::copy(&path, &dest_path)?;
        }
    }
    Ok(())
}

fn extract_pgdata_seed(seed_path: &Path, dest_dir: &Path) -> Result<()> {
    use std::io::BufReader;

    let file = std::fs::File::open(seed_path).context("Failed to open PGDATA seed tarball")?;

    let decoder = zstd::stream::Decoder::new(BufReader::new(file))
        .context("Failed to create zstd decoder")?;

    let mut archive = tar::Archive::new(decoder);

    std::fs::create_dir_all(dest_dir)?;

    archive
        .unpack(dest_dir)
        .context("Failed to extract PGDATA seed tarball")?;

    eprintln!("[PGDATA] Extracted seed to {:?}", dest_dir);

    Ok(())
}

fn create_optimized_engine() -> Result<Engine> {
    let mut config = Config::new();

    // Copy-on-write memory initialization for faster instantiation
    config.memory_init_cow(true);

    // Defer table element initialization for faster instantiation
    config.table_lazy_init(true);

    // Pre-reserve 64MB for dense memory image (PGlite's heap size)
    config.memory_guaranteed_dense_image_size(64 * 1024 * 1024);

    Engine::new(&config).context("Failed to create Wasmtime engine")
}

fn load_module(engine: &Engine, wasm_path: Option<&PathBuf>) -> Result<Module> {
    let cwasm_bytes = if let Some(path) = wasm_path {
        let cwasm_path = path.with_extension("cwasm");

        if cwasm_path.exists() {
            std::fs::read(&cwasm_path).context("Failed to read pre-compiled CWASM")?
        } else {
            anyhow::bail!(
                "Pre-compiled module not found: {:?}\n\
                Please run: cargo run --release --example precompile -- {:?} {:?}",
                cwasm_path,
                path,
                cwasm_path
            );
        }
    } else {
        use crate::assets;
        assets::PGLITE_CWASM.to_vec()
    };

    unsafe {
        Module::deserialize(engine, &cwasm_bytes)
            .context("Failed to deserialize pre-compiled module")
    }
}

pub struct PgliteConfig {
    pub data_dir: PathBuf,
    pub tcp_port: u16,
    pub wasm_path: Option<PathBuf>,
    pub prefix_dir: Option<PathBuf>,
    pub pgdata_seed_path: Option<PathBuf>,
}

pub struct SharedModule {
    pub engine: Engine,
    pub module: Module,
}

impl SharedModule {
    pub fn new(wasm_path: &PathBuf) -> Result<Self> {
        let engine = create_optimized_engine()?;
        let module = load_module(&engine, Some(wasm_path))?;
        Ok(Self { engine, module })
    }
}

struct WasiSetupResult {
    wasi_builder: WasiCtxBuilder,
    memory_tmp_dir: Option<PathBuf>,
}

fn build_base_wasi_builder() -> WasiCtxBuilder {
    let mut builder = WasiCtxBuilder::new();
    builder
        .inherit_stdio()
        .env("PGCLIENTENCODING", "UTF8")
        .env("REPL", "N")
        .env("LC_CTYPE", "en_US.UTF-8")
        .env("TZ", "UTC")
        .env("PGTZ", "UTC")
        .env("PGDATABASE", "template1")
        .env("PG_COLOR", "always")
        .env("PGUSER", "postgres");
    builder
}

fn build_memory_mode_wasi(
    prefix_dir: &Path,
    pgdata_seed_path: &Option<PathBuf>,
) -> Result<WasiSetupResult> {
    let unique_id = std::process::id();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let isolated_tmp = std::env::temp_dir().join(format!("pglite_mem_{}_{}", unique_id, timestamp));

    std::fs::create_dir_all(&isolated_tmp)?;

    let source_pglite = prefix_dir.join("tmp/pglite");
    let dest_pglite = isolated_tmp.join("pglite");
    std::fs::create_dir_all(&dest_pglite)?;

    let source_share = source_pglite.join("share");
    let dest_share = dest_pglite.join("share");
    if source_share.exists() {
        copy_dir_recursive(&source_share, &dest_share)?;
    }

    for entry in std::fs::read_dir(&source_pglite)? {
        let entry = entry?;
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if name_str != "share" && name_str != "base" {
            let src_path = entry.path();
            let dst_path = dest_pglite.join(&name);
            if src_path.is_dir() {
                copy_dir_recursive(&src_path, &dst_path)?;
            } else {
                std::fs::copy(&src_path, &dst_path)?;
            }
        }
    }

    let dest_base = dest_pglite.join("base");
    if let Some(ref seed_path) = pgdata_seed_path {
        if seed_path.exists() {
            extract_pgdata_seed(seed_path, &dest_base)?;
        } else {
            eprintln!(
                "[PGDATA] Seed not found at {:?}, will run initdb",
                seed_path
            );
        }
    }

    let mut wasi_builder = build_base_wasi_builder();
    wasi_builder
        .env("PGDATA", "/tmp/pglite/base")
        .env("PREFIX", "/tmp/pglite")
        .env("PGSYSCONFDIR", "/tmp/pglite");

    wasi_builder
        .preopened_dir(&isolated_tmp, "/tmp", DirPerms::all(), FilePerms::all())
        .context("Failed to preopen tmp directory")?;

    wasi_builder
        .preopened_dir("/dev", "/dev", DirPerms::READ, FilePerms::READ)
        .context("Failed to preopen /dev directory")?;

    Ok(WasiSetupResult {
        wasi_builder,
        memory_tmp_dir: Some(isolated_tmp),
    })
}

fn build_persistent_mode_wasi(prefix_dir: &Path, data_dir: &Path) -> Result<WasiSetupResult> {
    let tmp_dir = prefix_dir.join("tmp");
    std::fs::create_dir_all(data_dir)?;
    let actual_data_dir = data_dir.canonicalize()?;
    let data_dir_str = actual_data_dir
        .to_str()
        .context("Data directory path is not valid UTF-8")?;

    let mut wasi_builder = build_base_wasi_builder();
    wasi_builder
        .env("PGDATA", data_dir_str)
        .env("PREFIX", "/tmp/pglite")
        .env("PGSYSCONFDIR", "/tmp/pglite");

    wasi_builder
        .preopened_dir(&tmp_dir, "/tmp", DirPerms::all(), FilePerms::all())
        .context("Failed to preopen tmp directory")?;

    wasi_builder
        .preopened_dir(
            &actual_data_dir,
            data_dir_str,
            DirPerms::all(),
            FilePerms::all(),
        )
        .context("Failed to preopen data directory")?;

    wasi_builder
        .preopened_dir("/dev", "/dev", DirPerms::READ, FilePerms::READ)
        .context("Failed to preopen /dev directory")?;

    Ok(WasiSetupResult {
        wasi_builder,
        memory_tmp_dir: None,
    })
}

pub struct PgliteRuntime {
    pub store: Arc<Mutex<Store<WasiP1Ctx>>>,
    pub instance: wasmtime::Instance,
    pub tcp_port: u16,
    pub data_dir: PathBuf,
    buffer_addr: u32,
    buffer_size: u32,
    memory_tmp_dir: Option<PathBuf>,
}

struct QueryRequest {
    query: Vec<u8>,
    response_tx: oneshot::Sender<Vec<u8>>,
}

/// Async executor with priority-based query scheduling.
/// High priority queries (COMMIT, ROLLBACK, etc.) are processed before normal queries
/// to minimize transaction lock hold times.
pub struct AsyncPgliteExecutor {
    high_priority_tx: mpsc::Sender<QueryRequest>,
    normal_priority_tx: mpsc::Sender<QueryRequest>,
    work_available: Arc<Notify>,
}

impl PgliteRuntime {
    pub fn new(config: PgliteConfig) -> Result<Self> {
        let engine = create_optimized_engine()?;
        let module = load_module(&engine, config.wasm_path.as_ref())?;

        Self::new_with_engine_and_module(config, &engine, &module)
    }

    pub fn new_with_shared_module(config: PgliteConfig, shared: &SharedModule) -> Result<Self> {
        Self::new_with_engine_and_module(config, &shared.engine, &shared.module)
    }

    fn new_with_engine_and_module(
        mut config: PgliteConfig,
        engine: &Engine,
        module: &Module,
    ) -> Result<Self> {
        let data_dir_str = config.data_dir.to_str().unwrap_or("");
        let is_memory_mode = data_dir_str.starts_with("memory://");

        let prefix_dir = if let Some(prefix) = config.prefix_dir {
            prefix.canonicalize().context("Failed to canonicalize prefix directory")?
        } else {
            ensure_prefix_dir()?
        };

        let pgdata_seed_path = match config.pgdata_seed_path.take() {
            Some(path) => Some(path),
            None => get_pgdata_seed_path()?,
        };

        let mut wasi_setup = if is_memory_mode {
            build_memory_mode_wasi(&prefix_dir, &pgdata_seed_path)?
        } else {
            build_persistent_mode_wasi(&prefix_dir, &config.data_dir)?
        };

        let wasi = wasi_setup.wasi_builder.build_p1();

        let mut store = Store::new(engine, wasi);
        let mut linker = Linker::new(engine);

        wasmtime_wasi::p1::add_to_linker_sync(&mut linker, |s| s)
            .context("Failed to add WASI to linker")?;

        let instance = linker
            .instantiate(&mut store, module)
            .context("Failed to instantiate WASM module")?;

        let store = Arc::new(Mutex::new(store));

        let data_dir = if is_memory_mode {
            config.data_dir.clone()
        } else {
            config.data_dir.canonicalize()?
        };

        Ok(PgliteRuntime {
            store,
            instance,
            tcp_port: config.tcp_port,
            data_dir,
            buffer_addr: 0,
            buffer_size: 0,
            memory_tmp_dir: wasi_setup.memory_tmp_dir,
        })
    }

    pub fn init_postgres(&mut self) -> Result<()> {
        // Always call init_postgres_full - pgl_initdb will detect if PGDATA exists
        // and skip the expensive initialization. The seed just provides the files.
        self.init_postgres_full(true)
    }

    fn init_postgres_full(&mut self, run_initdb: bool) -> Result<()> {
        let mut store = self.store.lock().unwrap();

        if let Some(start_fn) = self.instance.get_func(&mut *store, "_start") {
            start_fn.call(&mut *store, &[], &mut [])?;
        }

        if let Some(get_buffer_addr) = self.instance.get_func(&mut *store, "get_buffer_addr") {
            let mut results = [Val::I32(0)];
            get_buffer_addr.call(&mut *store, &[Val::I32(0)], &mut results)?;
            if let Val::I32(addr) = results[0] {
                self.buffer_addr = addr as u32;
            }
        }

        if let Some(get_buffer_size) = self.instance.get_func(&mut *store, "get_buffer_size") {
            let mut results = [Val::I32(0)];
            get_buffer_size.call(&mut *store, &[Val::I32(0)], &mut results)?;
            if let Val::I32(size) = results[0] {
                self.buffer_size = size as u32;
            }
        }

        if let Some(use_wire) = self.instance.get_func(&mut *store, "use_wire") {
            use_wire.call(&mut *store, &[Val::I32(1)], &mut [])?;
        }

        if run_initdb {
            if let Some(initdb) = self.instance.get_func(&mut *store, "pgl_initdb") {
                let mut results = [Val::I32(0)];
                initdb.call(&mut *store, &[], &mut results)?;
            }
        }

        if let Some(backend) = self.instance.get_func(&mut *store, "pgl_backend") {
            backend.call(&mut *store, &[], &mut [])?;
        }

        Ok(())
    }

    /// Perform a clean PostgreSQL shutdown with checkpoint.
    /// This ensures WAL is flushed and the database is in a consistent state.
    /// Used when creating PGDATA snapshots.
    pub fn shutdown(&mut self) -> Result<()> {
        let mut store = self.store.lock().unwrap();

        // The WASM export name is "pgl_shutdown" (internal name is "pg_shutdown")
        if let Some(shutdown_fn) = self.instance.get_func(&mut *store, "pgl_shutdown") {
            shutdown_fn.call(&mut *store, &[], &mut [])?;
        }

        Ok(())
    }

    fn get_memory_locked(&self, store: &mut Store<WasiP1Ctx>) -> Result<Memory> {
        self.instance
            .get_memory(store, "memory")
            .context("Failed to get WASM memory")
    }

    fn write_to_buffer_locked(&self, store: &mut Store<WasiP1Ctx>, data: &[u8]) -> Result<()> {
        if data.len() > self.buffer_size as usize {
            anyhow::bail!(
                "Wire message ({} bytes) exceeds WASM buffer size ({} bytes)",
                data.len(),
                self.buffer_size
            );
        }

        let memory = self.get_memory_locked(store)?;
        memory.write(store, self.buffer_addr as usize, data)?;
        Ok(())
    }

    fn read_from_buffer_at_offset_locked(
        &self,
        store: &mut Store<WasiP1Ctx>,
        len: usize,
        offset: usize,
    ) -> Result<Vec<u8>> {
        let memory = self.get_memory_locked(store)?;
        let mut data = vec![0u8; len];
        let read_addr = self.buffer_addr as usize + offset;
        memory.read(store, read_addr, &mut data)?;
        Ok(data)
    }

    fn interactive_write_locked(&self, store: &mut Store<WasiP1Ctx>, len: usize) -> Result<()> {
        if let Some(func) = self.instance.get_func(&mut *store, "interactive_write") {
            func.call(store, &[Val::I32(len as i32)], &mut [])?;
        }
        Ok(())
    }

    fn interactive_read_locked(&self, store: &mut Store<WasiP1Ctx>) -> Result<i32> {
        if let Some(func) = self.instance.get_func(&mut *store, "interactive_read") {
            let mut results = [Val::I32(0)];
            func.call(store, &[], &mut results)
                .context("Failed to call interactive_read WASM function")?;
            if let Val::I32(len) = results[0] {
                return Ok(len);
            }
        }
        Ok(0)
    }

    fn interactive_one_locked(&self, store: &mut Store<WasiP1Ctx>) -> Result<()> {
        if let Some(func) = self.instance.get_func(&mut *store, "interactive_one") {
            func.call(store, &[], &mut [])?;
        }
        Ok(())
    }

    pub fn process_wire_message(&self, data: &[u8]) -> Result<Vec<u8>> {
        let mut store = self.store.lock().unwrap();

        self.write_to_buffer_locked(&mut store, data)?;
        self.interactive_write_locked(&mut store, data.len())?;

        if let Err(e) = self.interactive_one_locked(&mut store) {
            return Ok(create_error_response_from_trap(&e.to_string()));
        }

        let response_offset = data.len() + 1;

        for _ in 0..MAX_RESPONSE_POLL_ITERATIONS {
            let response_len = self.interactive_read_locked(&mut store)?;
            if response_len > 0 {
                return self.read_from_buffer_at_offset_locked(
                    &mut store,
                    response_len as usize,
                    response_offset,
                );
            }
            self.interactive_one_locked(&mut store)?;
        }

        Ok(Vec::new())
    }
}

impl AsyncPgliteExecutor {
    pub fn new(runtime: Arc<PgliteRuntime>) -> Self {
        // Separate channels for high and normal priority queries
        // High priority channel is smaller since transaction commands are less frequent
        let (high_priority_tx, high_priority_rx) = mpsc::channel::<QueryRequest>(100);
        let (normal_priority_tx, normal_priority_rx) = mpsc::channel::<QueryRequest>(1000);
        let work_available = Arc::new(Notify::new());
        let work_available_clone = Arc::clone(&work_available);

        tokio::spawn(async move {
            let mut high_rx = high_priority_rx;
            let mut normal_rx = normal_priority_rx;
            let notify = work_available_clone;

            loop {
                // biased select ensures high priority queries are always checked first
                tokio::select! {
                    biased;

                    // High priority: transaction control commands (COMMIT, ROLLBACK, etc.)
                    result = high_rx.recv() => {
                        match result {
                            Some(request) => {
                                let _permit = WASM_SEMAPHORE.acquire().await;

                                match runtime.process_wire_message(&request.query) {
                                    Ok(response) => {
                                        let _ = request.response_tx.send(response);
                                    }
                                    Err(_) => {
                                        let _ = request.response_tx.send(Vec::new());
                                    }
                                }
                            }
                            None => {
                                // High priority channel closed, but normal might still be active
                            }
                        }
                    }

                    // Normal priority: regular queries
                    result = normal_rx.recv() => {
                        match result {
                            Some(request) => {
                                let _permit = WASM_SEMAPHORE.acquire().await;

                                match runtime.process_wire_message(&request.query) {
                                    Ok(response) => {
                                        let _ = request.response_tx.send(response);
                                    }
                                    Err(_) => {
                                        let _ = request.response_tx.send(Vec::new());
                                    }
                                }
                            }
                            None => {
                                break;
                            }
                        }
                    }

                    _ = notify.notified() => {}
                }
            }
        });

        Self {
            high_priority_tx,
            normal_priority_tx,
            work_available,
        }
    }

    pub async fn execute_query(&self, query: Vec<u8>) -> Result<Vec<u8>> {
        let (response_tx, response_rx) = oneshot::channel();

        let priority = detect_priority(&query);

        let request = QueryRequest {
            query,
            response_tx,
        };

        let send_result = match priority {
            QueryPriority::High => self.high_priority_tx.send(request).await,
            QueryPriority::Normal => self.normal_priority_tx.send(request).await,
        };

        if send_result.is_ok() {
            self.work_available.notify_one();
            response_rx
                .await
                .map_err(|_| anyhow::anyhow!("Query execution failed"))
        } else {
            Err(anyhow::anyhow!("Executor channel closed"))
        }
    }
}

impl Drop for PgliteRuntime {
    fn drop(&mut self) {
        cleanup_prefix_dir();
        if let Some(ref tmp_dir) = self.memory_tmp_dir {
            if let Err(e) = std::fs::remove_dir_all(tmp_dir) {
                eprintln!("[WARNING] Failed to clean up temp dir {:?}: {}", tmp_dir, e);
            }
        }
    }
}

pub fn bind_tcp_socket(port: u16) -> Result<TcpListener> {
    TcpListener::bind(("127.0.0.1", port)).context(format!("Failed to bind to port {}", port))
}

fn create_error_response_from_trap(trap_error: &str) -> Vec<u8> {
    let (error_code, known_message) = detect_error_from_trap(trap_error);

    let error_message = match known_message {
        Some(msg) => msg.to_string(),
        None => {
            let truncated: String = trap_error.chars().take(200).collect();
            format!("WASM trap: {}", truncated)
        }
    };

    let mut payload = Vec::new();

    payload.push(b'S');
    payload.extend_from_slice(b"ERROR");
    payload.push(0);

    payload.push(b'V');
    payload.extend_from_slice(b"ERROR");
    payload.push(0);

    payload.push(b'C');
    payload.extend_from_slice(error_code.as_bytes());
    payload.push(0);

    payload.push(b'M');
    payload.extend_from_slice(error_message.as_bytes());
    payload.push(0);

    payload.push(0);

    let error_len = (4 + payload.len()) as u32;

    let mut response = Vec::new();
    response.push(b'E'); // ErrorResponse
    response.extend_from_slice(&error_len.to_be_bytes());
    response.extend_from_slice(&payload);

    // Add ReadyForQuery message ('Z' with idle state 'I')
    response.push(b'Z');
    response.extend_from_slice(&5u32.to_be_bytes()); // length = 5 (4 bytes length + 1 byte status)
    response.push(b'I'); // Idle (not in transaction)

    response
}

const PGLITE_SERVER_VERSION: &str = "17.5";

fn has_server_version(response: &[u8]) -> bool {
    WireMessageIter::new(response)
        .any(|msg| msg.msg_type == b'S' && msg.payload.starts_with(b"server_version\0"))
}

fn create_server_version_message() -> Vec<u8> {
    let name = b"server_version\0";
    let value = format!("{}\0", PGLITE_SERVER_VERSION);
    let value_bytes = value.as_bytes();
    let payload_len = name.len() + value_bytes.len();
    let msg_len = (4 + payload_len) as u32;

    let mut msg = Vec::with_capacity(1 + 4 + payload_len);
    msg.push(b'S'); // ParameterStatus
    msg.extend_from_slice(&msg_len.to_be_bytes());
    msg.extend_from_slice(name);
    msg.extend_from_slice(value_bytes);
    msg
}

fn find_ready_for_query(response: &[u8]) -> Option<usize> {
    let mut offset = 0;
    for msg in WireMessageIter::new(response) {
        if msg.msg_type == b'Z' {
            return Some(offset);
        }
        offset += 1 + 4 + msg.payload.len();
    }
    None
}

fn ensure_server_version(response: Vec<u8>, has_sent_server_version: &mut bool) -> Vec<u8> {
    if response.is_empty() || *has_sent_server_version {
        return response;
    }

    // Check if this response already contains server_version
    if has_server_version(&response) {
        *has_sent_server_version = true;
        return response;
    }

    // If response contains ReadyForQuery but no server_version, inject it
    if let Some(rfq_pos) = find_ready_for_query(&response) {
        let server_version_msg = create_server_version_message();
        let mut new_response = Vec::with_capacity(response.len() + server_version_msg.len());
        new_response.extend_from_slice(&response[..rfq_pos]);
        new_response.extend_from_slice(&server_version_msg);
        new_response.extend_from_slice(&response[rfq_pos..]);
        *has_sent_server_version = true;
        new_response
    } else {
        response
    }
}

fn message_starts_transaction(data: &[u8]) -> bool {
    if data.is_empty() {
        return false;
    }
    matches!(
        data[0],
        b'P' | b'Q' | b'B' | b'E' | b'D' | b'C' | b'H' | b'F'
    )
}

pub fn handle_connection(mut stream: TcpStream, runtime: Arc<PgliteRuntime>) -> Result<()> {
    use std::time::Duration;

    stream.set_nodelay(true)?;
    let mut buf = vec![0u8; 64 * 1024];
    let mut has_sent_server_version = false;

    let rt = tokio::runtime::Handle::try_current()
        .unwrap_or_else(|_| {
            tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .expect("Failed to create tokio runtime")
                .handle()
                .clone()
        });

    loop {
        stream.set_read_timeout(Some(Duration::from_millis(100)))?;

        match stream.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => {
                let _permit = rt.block_on(WASM_SEMAPHORE.acquire())
                    .expect("Semaphore closed");

                match runtime.process_wire_message(&buf[..n]) {
                    Ok(response) if !response.is_empty() => {
                        let response =
                            ensure_server_version(response, &mut has_sent_server_version);
                        stream.write_all(&response)?;
                        stream.flush()?;
                    }
                    Ok(_) => {}
                    Err(_) => break,
                }
            }
            Err(ref e)
                if e.kind() == std::io::ErrorKind::WouldBlock
                    || e.kind() == std::io::ErrorKind::TimedOut => {}
            Err(e) => return Err(e).context("Failed to read from client"),
        }
    }

    Ok(())
}

pub async fn handle_connection_async(
    stream: tokio::net::TcpStream,
    executor: Arc<AsyncPgliteExecutor>,
) -> Result<()> {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    let mut buf = vec![0u8; 64 * 1024];
    let mut has_sent_server_version = false;

    let mut reader = stream;
    reader.set_nodelay(true)?;

    loop {
        let n = match reader.read(&mut buf).await {
            Ok(0) => break,
            Ok(n) => n,
            Err(e) => return Err(e).context("Failed to read from client"),
        };

        let needs_init = !has_sent_server_version || message_starts_transaction(&buf[..n]);

        if needs_init {
            let _permit = WASM_SEMAPHORE.acquire().await;
        }

        match executor.execute_query(buf[..n].to_vec()).await {
            Ok(response) if !response.is_empty() => {
                let response = ensure_server_version(response, &mut has_sent_server_version);
                reader.write_all(&response).await?;
                reader.flush().await?;
            }
            Ok(_) => {}
            Err(_) => break,
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bind_tcp_socket() {
        let port = 55400 + (std::process::id() % 100) as u16;
        let listener = bind_tcp_socket(port).expect("Failed to bind socket");

        let local_addr = listener.local_addr().expect("Failed to get local addr");
        assert_eq!(local_addr.port(), port);
        assert_eq!(local_addr.ip().to_string(), "127.0.0.1");

        drop(listener);
    }

    #[test]
    fn test_bind_tcp_socket_fails_on_same_port() {
        let port = 55500 + (std::process::id() % 100) as u16;

        let listener1 = bind_tcp_socket(port).expect("Failed to bind first socket");
        let result = bind_tcp_socket(port);

        assert!(result.is_err(), "Should fail to bind same port twice");

        drop(listener1);
    }

    #[test]
    fn test_pglite_config_requires_all_fields() {
        let _config = PgliteConfig {
            data_dir: PathBuf::from("/tmp/test"),
            tcp_port: 54321,
            wasm_path: Some(PathBuf::from("/path/to/pglite.wasi")),
            prefix_dir: Some(PathBuf::from("/path/to/prefix")),
            pgdata_seed_path: None,
        };
    }

    #[test]
    fn test_runtime_fails_with_missing_wasm() {
        let config = PgliteConfig {
            data_dir: std::env::temp_dir().join("test_missing_wasm"),
            tcp_port: 55600,
            wasm_path: Some(PathBuf::from("/nonexistent/pglite.wasi")),
            prefix_dir: Some(PathBuf::from("/tmp")),
            pgdata_seed_path: None,
        };

        let result = PgliteRuntime::new(config);
        assert!(result.is_err());
        let err = result.err().unwrap();
        assert!(
            err.to_string().contains("not found"),
            "Should indicate WASM binary not found, got: {}",
            err
        );
    }

    #[test]
    fn test_create_server_version_message() {
        let msg = create_server_version_message();

        // Should start with 'S' for ParameterStatus
        assert_eq!(msg[0], b'S');

        // Should contain "server_version\0"
        assert!(msg.windows(15).any(|w| w == b"server_version\0"));

        // Should contain the version
        assert!(msg.windows(4).any(|w| w == b"17.5"));
    }

    #[test]
    fn test_has_server_version() {
        // Create a mock response with server_version ParameterStatus
        let mut response = Vec::new();
        // Add a ParameterStatus message for server_version
        let name = b"server_version\0";
        let value = b"17.5\0";
        let len = (4 + name.len() + value.len()) as u32;
        response.push(b'S');
        response.extend_from_slice(&len.to_be_bytes());
        response.extend_from_slice(name);
        response.extend_from_slice(value);

        assert!(has_server_version(&response));

        // Response without server_version
        let mut response2 = Vec::new();
        let name2 = b"application_name\0";
        let value2 = b"test\0";
        let len2 = (4 + name2.len() + value2.len()) as u32;
        response2.push(b'S');
        response2.extend_from_slice(&len2.to_be_bytes());
        response2.extend_from_slice(name2);
        response2.extend_from_slice(value2);

        assert!(!has_server_version(&response2));
    }

    #[test]
    fn test_find_ready_for_query() {
        // Create response with ParameterStatus then ReadyForQuery
        let mut response = Vec::new();

        // ParameterStatus message
        let name = b"test\0";
        let value = b"value\0";
        let len = (4 + name.len() + value.len()) as u32;
        response.push(b'S');
        response.extend_from_slice(&len.to_be_bytes());
        response.extend_from_slice(name);
        response.extend_from_slice(value);

        let rfq_pos = response.len();

        // ReadyForQuery message
        response.push(b'Z');
        response.extend_from_slice(&5u32.to_be_bytes()); // length = 5
        response.push(b'I'); // transaction status: idle

        assert_eq!(find_ready_for_query(&response), Some(rfq_pos));

        // Response without ReadyForQuery
        let response_no_rfq = &response[..rfq_pos];
        assert_eq!(find_ready_for_query(response_no_rfq), None);
    }

    #[test]
    fn test_ensure_server_version_already_present() {
        // Create response that already has server_version
        let mut response = Vec::new();
        let name = b"server_version\0";
        let value = b"17.5\0";
        let len = (4 + name.len() + value.len()) as u32;
        response.push(b'S');
        response.extend_from_slice(&len.to_be_bytes());
        response.extend_from_slice(name);
        response.extend_from_slice(value);

        // Add ReadyForQuery
        response.push(b'Z');
        response.extend_from_slice(&5u32.to_be_bytes());
        response.push(b'I');

        let original_len = response.len();
        let mut has_sent = false;
        let result = ensure_server_version(response.clone(), &mut has_sent);

        // Should return unchanged
        assert_eq!(result.len(), original_len);
        // Should mark as sent since response already had it
        assert!(has_sent);
    }

    #[test]
    fn test_ensure_server_version_injects_when_missing() {
        // Create response without server_version
        let mut response = Vec::new();

        // Some other ParameterStatus
        let name = b"application_name\0";
        let value = b"test\0";
        let len = (4 + name.len() + value.len()) as u32;
        response.push(b'S');
        response.extend_from_slice(&len.to_be_bytes());
        response.extend_from_slice(name);
        response.extend_from_slice(value);

        // ReadyForQuery
        response.push(b'Z');
        response.extend_from_slice(&5u32.to_be_bytes());
        response.push(b'I');

        let original_len = response.len();
        let mut has_sent = false;
        let result = ensure_server_version(response, &mut has_sent);

        // Should be longer (server_version injected)
        assert!(result.len() > original_len);

        // Should now have server_version
        assert!(has_server_version(&result));

        // Should still end with ReadyForQuery
        assert!(result.len() >= 6);
        assert_eq!(result[result.len() - 6], b'Z');

        // Should mark as sent
        assert!(has_sent);
    }

    #[test]
    fn test_ensure_server_version_already_sent() {
        // If we already sent server_version, don't process again
        let response = vec![b'Q', 0, 0, 0, 5, 0];
        let mut has_sent = true; // Already sent
        let result = ensure_server_version(response.clone(), &mut has_sent);
        assert_eq!(result, response);
    }

    #[test]
    fn test_is_complete_response_with_ready_for_query() {
        let mut response = Vec::new();

        // CommandComplete message: 'C' + length + "SELECT 1\0"
        let tag = b"SELECT 1\0";
        let len = (4 + tag.len()) as u32;
        response.push(b'C');
        response.extend_from_slice(&len.to_be_bytes());
        response.extend_from_slice(tag);

        // ReadyForQuery message: 'Z' + length(5) + status(I)
        response.push(b'Z');
        response.extend_from_slice(&5u32.to_be_bytes());
        response.push(b'I');

        assert!(is_complete_response(&response));
    }

    #[test]
    fn test_is_complete_response_without_ready_for_query() {
        let mut response = Vec::new();

        // Just a CommandComplete message without ReadyForQuery
        let tag = b"SELECT 1\0";
        let len = (4 + tag.len()) as u32;
        response.push(b'C');
        response.extend_from_slice(&len.to_be_bytes());
        response.extend_from_slice(tag);

        assert!(!is_complete_response(&response));
    }

    #[test]
    fn test_is_complete_response_with_error() {
        let mut response = Vec::new();

        // ErrorResponse message: 'E' + length + fields
        // Minimal error: severity + message + terminator
        let mut error_payload = Vec::new();
        error_payload.push(b'S'); // Severity field
        error_payload.extend_from_slice(b"ERROR\0");
        error_payload.push(b'M'); // Message field
        error_payload.extend_from_slice(b"relation \"nonexistent_table\" does not exist\0");
        error_payload.push(b'C'); // Code field
        error_payload.extend_from_slice(b"42P01\0"); // undefined_table
        error_payload.push(0); // Terminator

        let len = (4 + error_payload.len()) as u32;
        response.push(b'E');
        response.extend_from_slice(&len.to_be_bytes());
        response.extend_from_slice(&error_payload);

        // ReadyForQuery after error
        response.push(b'Z');
        response.extend_from_slice(&5u32.to_be_bytes());
        response.push(b'I');

        assert!(is_complete_response(&response));
    }

    #[test]
    fn test_is_complete_response_empty() {
        assert!(!is_complete_response(&[]));
    }

    #[test]
    fn test_is_complete_response_truncated() {
        // Truncated message (length says 100 but only 10 bytes present)
        let mut response = Vec::new();
        response.push(b'C');
        response.extend_from_slice(&100u32.to_be_bytes());
        response.extend_from_slice(b"short");

        assert!(!is_complete_response(&response));
    }

    fn is_complete_response(response: &[u8]) -> bool {
        WireMessageIter::new(response).any(|msg| msg.msg_type == b'Z')
    }

    fn extract_error_code(response: &[u8]) -> Option<String> {
        let msg = WireMessageIter::new(response).next()?;
        if msg.msg_type != b'E' {
            return None;
        }

        let mut i = 0;
        while i < msg.payload.len() {
            let field_type = msg.payload[i];
            if field_type == 0 {
                break;
            }
            i += 1;

            let end = msg.payload[i..].iter().position(|&b| b == 0)?;
            if field_type == b'C' {
                return std::str::from_utf8(&msg.payload[i..i + end])
                    .ok()
                    .map(String::from);
            }
            i += end + 1;
        }
        None
    }

    fn ends_with_ready_for_query(response: &[u8]) -> bool {
        response.len() >= 6
            && response[response.len() - 6] == b'Z'
            && response[response.len() - 5..response.len() - 1] == 5u32.to_be_bytes()
            && response[response.len() - 1] == b'I'
    }

    #[test]
    fn test_create_error_response_undefined_table() {
        // Simulate a WASM trap backtrace for undefined table
        let trap_error = "error while executing at wasm backtrace:
    0: 0x117db51 - pglite.wasi!abort
    1: 0x10b274e - pglite.wasi!errfinish
    2: 0x10a1234 - pglite.wasi!parserOpenTable
    3: 0x10a5678 - pglite.wasi!addRangeTableEntry";

        let response = create_error_response_from_trap(trap_error);

        assert!(!response.is_empty());
        assert_eq!(response[0], b'E', "Should start with ErrorResponse");
        assert_eq!(extract_error_code(&response), Some("42P01".to_string()));
        assert!(ends_with_ready_for_query(&response));
    }

    #[test]
    fn test_create_error_response_undefined_function() {
        let trap_error = "wasm trap at pglite.wasi!ParseFuncOrColumn";

        let response = create_error_response_from_trap(trap_error);

        assert_eq!(response[0], b'E');
        assert_eq!(extract_error_code(&response), Some("42883".to_string()));
        assert!(ends_with_ready_for_query(&response));
    }

    #[test]
    fn test_create_error_response_undefined_column() {
        let trap_error = "error: pglite.wasi!transformColumnRef failed";

        let response = create_error_response_from_trap(trap_error);

        assert_eq!(response[0], b'E');
        assert_eq!(extract_error_code(&response), Some("42703".to_string()));
        assert!(ends_with_ready_for_query(&response));
    }

    #[test]
    fn test_create_error_response_syntax_error() {
        let trap_error = "trap in pglite.wasi!scanner_yyerror";

        let response = create_error_response_from_trap(trap_error);

        assert_eq!(response[0], b'E');
        assert_eq!(extract_error_code(&response), Some("42601".to_string()));
        assert!(ends_with_ready_for_query(&response));
    }

    #[test]
    fn test_create_error_response_unknown_error() {
        // Unknown backtrace should return generic internal error
        let trap_error = "some unknown wasm trap error";

        let response = create_error_response_from_trap(trap_error);

        assert_eq!(response[0], b'E');
        assert_eq!(extract_error_code(&response), Some("XX000".to_string()));
        assert!(ends_with_ready_for_query(&response));
    }

    #[test]
    fn test_create_error_response_permission_denied() {
        let trap_error = "trap: pglite.wasi!aclcheck_error";

        let response = create_error_response_from_trap(trap_error);

        assert_eq!(response[0], b'E');
        assert_eq!(extract_error_code(&response), Some("42501".to_string()));
        assert!(ends_with_ready_for_query(&response));
    }

    #[test]
    fn test_create_error_response_unique_violation() {
        let trap_error = "error in pglite.wasi!ExecConstraints - unique violation";

        let response = create_error_response_from_trap(trap_error);

        assert_eq!(response[0], b'E');
        assert_eq!(extract_error_code(&response), Some("23505".to_string()));
        assert!(ends_with_ready_for_query(&response));
    }

    #[test]
    fn test_create_error_response_valid_wire_format() {
        let trap_error = "pglite.wasi!parserOpenTable";
        let response = create_error_response_from_trap(trap_error);

        // Verify ErrorResponse structure
        assert_eq!(response[0], b'E');

        let err_len =
            u32::from_be_bytes([response[1], response[2], response[3], response[4]]) as usize;
        let err_total = 1 + err_len;

        // Verify ReadyForQuery follows immediately
        assert_eq!(response[err_total], b'Z');
        assert_eq!(&response[err_total + 1..err_total + 5], &5u32.to_be_bytes());
        assert_eq!(response[err_total + 5], b'I');

        // Total response should be ErrorResponse + ReadyForQuery
        assert_eq!(response.len(), err_total + 6);
    }

    #[test]
    fn test_create_error_response_contains_severity() {
        let trap_error = "pglite.wasi!parserOpenTable";
        let response = create_error_response_from_trap(trap_error);

        // Check for severity field 'S' followed by "ERROR"
        let payload_start = 5;
        let err_len =
            u32::from_be_bytes([response[1], response[2], response[3], response[4]]) as usize;
        let payload = &response[payload_start..payload_start + err_len - 4];

        // First field should be severity
        assert_eq!(payload[0], b'S');
        assert!(payload[1..].starts_with(b"ERROR\0"));
    }

    #[test]
    fn test_create_error_response_range_var_get_relid() {
        // Another function that indicates undefined table
        let trap_error = "trap at pglite.wasi!RangeVarGetRelid";

        let response = create_error_response_from_trap(trap_error);

        assert_eq!(extract_error_code(&response), Some("42P01".to_string()));
    }

    #[test]
    fn test_create_error_response_lookup_func_name() {
        // Another function that indicates undefined function
        let trap_error = "trap at pglite.wasi!LookupFuncName";

        let response = create_error_response_from_trap(trap_error);

        assert_eq!(extract_error_code(&response), Some("42883".to_string()));
    }

    #[test]
    fn test_create_error_response_col_name_to_var() {
        // Another function that indicates undefined column
        let trap_error = "error: pglite.wasi!colNameToVar";

        let response = create_error_response_from_trap(trap_error);

        assert_eq!(extract_error_code(&response), Some("42703".to_string()));
    }

    #[test]
    fn test_create_error_response_base_yyerror() {
        // Another function that indicates syntax error
        let trap_error = "trap at pglite.wasi!base_yyerror";

        let response = create_error_response_from_trap(trap_error);

        assert_eq!(extract_error_code(&response), Some("42601".to_string()));
    }

    // Priority detection tests
    fn create_simple_query_message(sql: &str) -> Vec<u8> {
        // Simple Query protocol: 'Q' + length (4 bytes) + query string + null terminator
        let query_bytes = sql.as_bytes();
        let len = (4 + query_bytes.len() + 1) as u32; // length includes itself + query + null

        let mut msg = Vec::new();
        msg.push(b'Q');
        msg.extend_from_slice(&len.to_be_bytes());
        msg.extend_from_slice(query_bytes);
        msg.push(0); // null terminator
        msg
    }

    fn create_parse_message(statement_name: &str, sql: &str) -> Vec<u8> {
        // Parse message: 'P' + length + statement_name + null + query + null + param_count (2 bytes)
        let name_bytes = statement_name.as_bytes();
        let query_bytes = sql.as_bytes();
        let len = (4 + name_bytes.len() + 1 + query_bytes.len() + 1 + 2) as u32;

        let mut msg = Vec::new();
        msg.push(b'P');
        msg.extend_from_slice(&len.to_be_bytes());
        msg.extend_from_slice(name_bytes);
        msg.push(0); // null terminator for name
        msg.extend_from_slice(query_bytes);
        msg.push(0); // null terminator for query
        msg.extend_from_slice(&0u16.to_be_bytes()); // zero parameters
        msg
    }

    #[test]
    fn test_detect_priority_commit_simple_query() {
        let msg = create_simple_query_message("COMMIT");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_commit_lowercase() {
        let msg = create_simple_query_message("commit");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_commit_mixed_case() {
        let msg = create_simple_query_message("CoMmIt");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_rollback() {
        let msg = create_simple_query_message("ROLLBACK");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_end_transaction() {
        let msg = create_simple_query_message("END");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_abort() {
        let msg = create_simple_query_message("ABORT");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_savepoint() {
        let msg = create_simple_query_message("SAVEPOINT my_savepoint");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_release_savepoint() {
        let msg = create_simple_query_message("RELEASE SAVEPOINT my_savepoint");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_select_is_normal() {
        let msg = create_simple_query_message("SELECT * FROM users");
        assert_eq!(detect_priority(&msg), QueryPriority::Normal);
    }

    #[test]
    fn test_detect_priority_insert_is_normal() {
        let msg = create_simple_query_message("INSERT INTO users (name) VALUES ('test')");
        assert_eq!(detect_priority(&msg), QueryPriority::Normal);
    }

    #[test]
    fn test_detect_priority_update_is_normal() {
        let msg = create_simple_query_message("UPDATE users SET name = 'test'");
        assert_eq!(detect_priority(&msg), QueryPriority::Normal);
    }

    #[test]
    fn test_detect_priority_delete_is_normal() {
        let msg = create_simple_query_message("DELETE FROM users WHERE id = 1");
        assert_eq!(detect_priority(&msg), QueryPriority::Normal);
    }

    #[test]
    fn test_detect_priority_begin_is_normal() {
        // BEGIN starts a transaction but doesn't need priority - it's COMMIT/ROLLBACK that do
        let msg = create_simple_query_message("BEGIN");
        assert_eq!(detect_priority(&msg), QueryPriority::Normal);
    }

    #[test]
    fn test_detect_priority_commit_with_whitespace() {
        let msg = create_simple_query_message("  COMMIT  ");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_rollback_to_savepoint() {
        let msg = create_simple_query_message("ROLLBACK TO SAVEPOINT my_savepoint");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_parse_message_commit() {
        let msg = create_parse_message("", "COMMIT");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_parse_message_select() {
        let msg = create_parse_message("stmt1", "SELECT * FROM users WHERE id = $1");
        assert_eq!(detect_priority(&msg), QueryPriority::Normal);
    }

    #[test]
    fn test_detect_priority_parse_message_rollback() {
        let msg = create_parse_message("rollback_stmt", "ROLLBACK");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }

    #[test]
    fn test_detect_priority_empty_data() {
        assert_eq!(detect_priority(&[]), QueryPriority::Normal);
    }

    #[test]
    fn test_detect_priority_short_data() {
        assert_eq!(detect_priority(&[b'Q', 0, 0]), QueryPriority::Normal);
    }

    #[test]
    fn test_detect_priority_unknown_message_type() {
        let msg = vec![b'X', 0, 0, 0, 5, b'Q'];
        assert_eq!(detect_priority(&msg), QueryPriority::Normal);
    }

    #[test]
    fn test_detect_priority_commit_semicolon() {
        let msg = create_simple_query_message("COMMIT;");
        assert_eq!(detect_priority(&msg), QueryPriority::High);
    }
}
