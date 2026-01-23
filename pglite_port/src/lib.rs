use anyhow::{Context, Result};
use once_cell::sync::Lazy;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use wasmtime::{Config, Engine, Linker, Memory, Module, Store, Val};
use wasmtime_wasi::p1::WasiP1Ctx;
use wasmtime_wasi::{DirPerms, FilePerms, WasiCtxBuilder};

static CONNECTION_SERIALIZER: Lazy<Mutex<()>> = Lazy::new(|| Mutex::new(()));

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

const ERROR_PATTERNS: &[(&[&str], &str, &str)] = &[
    // Class 42 - Syntax Error or Access Rule Violation
    (&["parserOpenTable", "addRangeTableEntry", "RangeVarGetRelid", "relation_openrv"], "42P01", "relation does not exist"),
    (&["ParseFuncOrColumn", "LookupFuncName", "LookupFuncWithArgs"], "42883", "function does not exist"),
    (&["transformColumnRef", "colNameToVar", "errorMissingColumn"], "42703", "column does not exist"),
    (&["scanner_yyerror", "base_yyerror", "syntax_error"], "42601", "syntax error"),
    (&["aclcheck", "permission", "pg_aclcheck"], "42501", "permission denied"),
    (&["LookupTypeName", "typenameType", "TypeNameToString"], "42704", "undefined object"),
    (&["LookupOperName", "LookupOperWithArgs", "oper_select_candidate"], "42883", "operator does not exist"),
    (&["errorMissingRTE", "errorConflictingDefElem"], "42P01", "undefined table"),
    (&["transformExpr", "coerce_type", "coerce_to_target_type"], "42846", "cannot coerce"),
    (&["RI_FKey_check", "ri_Check_Pk_Match"], "23503", "foreign key violation"),

    // Class 23 - Integrity Constraint Violation
    (&["ExecConstraints", "_bt_check_unique", "unique_key_recheck"], "23505", "unique constraint violation"),
    (&["ExecRelCheck", "ExecPartitionCheck", "domain_check_input"], "23514", "check constraint violation"),
    (&["ExecCheckIndexConstraints", "check_exclusion_constraint"], "23P01", "exclusion constraint violation"),
    (&["ri_ReportViolation", "RI_FKey_noaction", "RI_FKey_restrict"], "23503", "foreign key violation"),
    (&["not_null_violation", "ExecConstraints"], "23502", "not null violation"),
    (&["ExecInsert", "ExecUpdate", "ExecDelete"], "23000", "integrity constraint violation"),

    // Class 22 - Data Exception
    (&["division_by_zero", "int4div", "int8div", "float8div"], "22012", "division by zero"),
    (&["numeric_overflow", "overflow", "int4mul", "int8mul"], "22003", "numeric value out of range"),
    (&["DateTimeParseError", "datetime_field_overflow"], "22008", "datetime field overflow"),
    (&["invalid_text_representation", "pg_strtoint"], "22P02", "invalid text representation"),
    (&["string_data_right_truncation", "varchar"], "22001", "string data right truncation"),

    // Class 3D - Invalid Catalog Name
    (&["get_database_oid", "GetDatabasePath"], "3D000", "invalid catalog name"),

    // Class 3F - Invalid Schema Name
    (&["LookupNamespace", "get_namespace_oid", "schema"], "3F000", "invalid schema name"),

    // Class 40 - Transaction Rollback
    (&["deadlock_detected", "DeadLockReport", "CheckDeadLock"], "40P01", "deadlock detected"),
    (&["serialization_failure", "OnConflict"], "40001", "serialization failure"),

    // Class 53 - Insufficient Resources
    (&["out_of_memory", "MemoryContextAlloc"], "53200", "out of memory"),
    (&["disk_full", "FileWrite"], "53100", "disk full"),

    // Class 57 - Operator Intervention
    (&["query_canceled", "cancel"], "57014", "query canceled"),

    // Class 54 - Program Limit Exceeded
    (&["too_many_columns", "MaxTupleAttributeNumber"], "54011", "too many columns"),
    (&["statement_too_complex", "expression_too_deep"], "54001", "statement too complex"),
];

fn detect_error_from_trap(trap_error: &str) -> (&'static str, Option<&'static str>) {
    for (patterns, code, msg) in ERROR_PATTERNS {
        if patterns.iter().any(|p| trap_error.contains(p)) {
            return (code, Some(msg));
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

    let file = std::fs::File::open(seed_path)
        .context("Failed to open PGDATA seed tarball")?;

    let decoder = zstd::stream::Decoder::new(BufReader::new(file))
        .context("Failed to create zstd decoder")?;

    let mut archive = tar::Archive::new(decoder);

    std::fs::create_dir_all(dest_dir)?;

    archive.unpack(dest_dir)
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

fn load_module(engine: &Engine, wasm_path: &PathBuf) -> Result<Module> {
    let cwasm_path = wasm_path.with_extension("cwasm");

    if cwasm_path.exists() {
        let cwasm_bytes = std::fs::read(&cwasm_path)
            .context("Failed to read pre-compiled CWASM")?;
        unsafe {
            Module::deserialize(engine, &cwasm_bytes)
                .context("Failed to deserialize pre-compiled module")
        }
    } else {
        anyhow::bail!(
            "Pre-compiled module not found: {:?}\n\
            Please run: cargo run --release --example precompile -- {:?} {:?}",
            cwasm_path,
            wasm_path,
            cwasm_path
        );
    }
}

pub struct PgliteConfig {
    pub data_dir: PathBuf,
    pub tcp_port: u16,
    pub wasm_path: PathBuf,
    pub prefix_dir: PathBuf,
    pub pgdata_seed_path: Option<PathBuf>,
}

pub struct SharedModule {
    pub engine: Engine,
    pub module: Module,
}

impl SharedModule {
    pub fn new(wasm_path: &PathBuf) -> Result<Self> {
        let engine = create_optimized_engine()?;
        let module = load_module(&engine, wasm_path)?;
        Ok(Self { engine, module })
    }
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

impl PgliteRuntime {
    pub fn new(config: PgliteConfig) -> Result<Self> {
        let engine = create_optimized_engine()?;
        let module = load_module(&engine, &config.wasm_path)?;

        Self::new_with_engine_and_module(config, &engine, &module)
    }

    pub fn new_with_shared_module(config: PgliteConfig, shared: &SharedModule) -> Result<Self> {
        Self::new_with_engine_and_module(config, &shared.engine, &shared.module)
    }

    fn new_with_engine_and_module(config: PgliteConfig, engine: &Engine, module: &Module) -> Result<Self> {
        let data_dir_str = config.data_dir.to_str().unwrap_or("");
        let is_memory_mode = data_dir_str.starts_with("memory://");

        let prefix_dir = config.prefix_dir.canonicalize()
            .context("Failed to canonicalize prefix directory")?;

        let mut wasi_builder = WasiCtxBuilder::new();

        wasi_builder
            .inherit_stdio()
            .env("PGCLIENTENCODING", "UTF8")
            .env("REPL", "N")
            .env("LC_CTYPE", "en_US.UTF-8")
            .env("TZ", "UTC")
            .env("PGTZ", "UTC")
            .env("PGDATABASE", "template1")
            .env("PG_COLOR", "always")
            .env("PGUSER", "postgres");

        let memory_tmp_dir: Option<PathBuf>;

        if is_memory_mode {
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

            // Extract PGDATA seed if provided - this skips the expensive initdb
            let dest_base = dest_pglite.join("base");
            if let Some(ref seed_path) = config.pgdata_seed_path {
                if seed_path.exists() {
                    extract_pgdata_seed(seed_path, &dest_base)?;
                } else {
                    eprintln!("[PGDATA] Seed not found at {:?}, will run initdb", seed_path);
                }
            }

            memory_tmp_dir = Some(isolated_tmp.clone());

            wasi_builder
                .env("PGDATA", "/tmp/pglite/base")
                .env("PREFIX", "/tmp/pglite")
                .env("PGSYSCONFDIR", "/tmp/pglite");

            wasi_builder.preopened_dir(
                &isolated_tmp,
                "/tmp",
                DirPerms::all(),
                FilePerms::all(),
            ).context("Failed to preopen tmp directory")?;

            wasi_builder.preopened_dir(
                "/dev",
                "/dev",
                DirPerms::READ,
                FilePerms::READ,
            ).context("Failed to preopen /dev directory")?;
        } else {
            memory_tmp_dir = None;
            let tmp_dir = prefix_dir.join("tmp");
            std::fs::create_dir_all(&config.data_dir)?;
            let actual_data_dir = config.data_dir.canonicalize()?;
            let data_dir_str = actual_data_dir.to_str()
                .context("Data directory path is not valid UTF-8")?;

            wasi_builder
                .env("PGDATA", data_dir_str)
                .env("PREFIX", "/tmp/pglite")
                .env("PGSYSCONFDIR", "/tmp/pglite");

            wasi_builder.preopened_dir(
                &tmp_dir,
                "/tmp",
                DirPerms::all(),
                FilePerms::all(),
            ).context("Failed to preopen tmp directory")?;

            wasi_builder.preopened_dir(
                &actual_data_dir,
                data_dir_str,
                DirPerms::all(),
                FilePerms::all(),
            ).context("Failed to preopen data directory")?;

            wasi_builder.preopened_dir(
                "/dev",
                "/dev",
                DirPerms::READ,
                FilePerms::READ,
            ).context("Failed to preopen /dev directory")?;
        }

        let wasi = wasi_builder.build_p1();

        let mut store = Store::new(engine, wasi);
        let mut linker = Linker::new(engine);

        wasmtime_wasi::p1::add_to_linker_sync(&mut linker, |s| s)
            .context("Failed to add WASI to linker")?;

        let instance = linker.instantiate(&mut store, module)
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
            memory_tmp_dir,
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
            func.call(store, &[], &mut results)?;
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

        for _ in 0..=10 {
            let response_len = self.interactive_read_locked(&mut store)?;
            if response_len > 0 {
                return self.read_from_buffer_at_offset_locked(&mut store, response_len as usize, response_offset);
            }
            self.interactive_one_locked(&mut store)?;
        }

        Ok(Vec::new())
    }

}

impl Drop for PgliteRuntime {
    fn drop(&mut self) {
        if let Some(ref tmp_dir) = self.memory_tmp_dir {
            let _ = std::fs::remove_dir_all(tmp_dir);
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

fn ensure_server_version(
    response: Vec<u8>,
    has_sent_server_version: &mut bool,
) -> Vec<u8> {
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

fn response_has_ready_for_query(response: &[u8]) -> bool {
    WireMessageIter::new(response).any(|msg| msg.msg_type == b'Z')
}

fn message_starts_transaction(data: &[u8]) -> bool {
    if data.is_empty() {
        return false;
    }
    matches!(data[0], b'P' | b'Q' | b'B' | b'E' | b'D' | b'C' | b'H' | b'F')
}

pub fn handle_connection(mut stream: TcpStream, runtime: Arc<PgliteRuntime>) -> Result<()> {
    use std::sync::MutexGuard;
    use std::time::Duration;

    stream.set_nodelay(true)?;
    let mut buf = vec![0u8; 64 * 1024];
    let mut has_sent_server_version = false;
    let mut held_lock: Option<MutexGuard<'_, ()>> = None;

    loop {
        stream.set_read_timeout(Some(Duration::from_millis(100)))?;

        match stream.read(&mut buf) {
            Ok(0) => break,
            Ok(n) => {
                let needs_lock = held_lock.is_none()
                    && (message_starts_transaction(&buf[..n]) || !has_sent_server_version);

                if needs_lock {
                    held_lock = Some(CONNECTION_SERIALIZER.lock().unwrap());
                }

                match runtime.process_wire_message(&buf[..n]) {
                    Ok(response) if !response.is_empty() => {
                        let response =
                            ensure_server_version(response, &mut has_sent_server_version);
                        stream.write_all(&response)?;
                        stream.flush()?;

                        if response_has_ready_for_query(&response) {
                            held_lock = None;
                        }
                    }
                    Ok(_) => {}
                    Err(_) => break,
                }
            }
            Err(ref e)
                if e.kind() == std::io::ErrorKind::WouldBlock
                    || e.kind() == std::io::ErrorKind::TimedOut =>
            {
                continue;
            }
            Err(e) => return Err(e).context("Failed to read from client"),
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
            wasm_path: PathBuf::from("/path/to/pglite.wasi"),
            prefix_dir: PathBuf::from("/path/to/prefix"),
            pgdata_seed_path: None,
        };
    }

    #[test]
    fn test_runtime_fails_with_missing_wasm() {
        let config = PgliteConfig {
            data_dir: std::env::temp_dir().join("test_missing_wasm"),
            tcp_port: 55600,
            wasm_path: PathBuf::from("/nonexistent/pglite.wasi"),
            prefix_dir: PathBuf::from("/tmp"),
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
                return std::str::from_utf8(&msg.payload[i..i + end]).ok().map(String::from);
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

        let err_len = u32::from_be_bytes([response[1], response[2], response[3], response[4]]) as usize;
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
        let err_len = u32::from_be_bytes([response[1], response[2], response[3], response[4]]) as usize;
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
}
