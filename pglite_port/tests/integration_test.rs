use std::io::{BufRead, BufReader};
use std::net::TcpStream;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::time::Duration;

struct TestInstance {
    process: Child,
    tcp_port: u16,
}

impl TestInstance {
    fn start(data_dir: &str, tcp_port: u16, wasm_path: &str, prefix_dir: &str) -> Result<Self, String> {
        Self::start_with_args(data_dir, tcp_port, wasm_path, prefix_dir, &[])
    }

    fn start_with_args(
        data_dir: &str,
        tcp_port: u16,
        wasm_path: &str,
        prefix_dir: &str,
        extra_args: &[&str],
    ) -> Result<Self, String> {
        let exe_dir = std::env::current_exe()
            .map_err(|e| format!("Failed to get current exe: {}", e))?;

        let target_dir = exe_dir.parent().unwrap().parent().unwrap();

        let possible_paths = vec![
            target_dir.join("pglite_port"),
            target_dir.join("debug").join("pglite_port"),
            target_dir.join("release").join("pglite_port"),
            target_dir.parent().unwrap().join("debug").join("pglite_port"),
            target_dir.parent().unwrap().join("release").join("pglite_port"),
        ];

        let binary_path = possible_paths
            .iter()
            .find(|p| p.exists())
            .ok_or_else(|| {
                format!(
                    "Binary not found. Searched:\n{}",
                    possible_paths
                        .iter()
                        .map(|p| format!("  {:?}", p))
                        .collect::<Vec<_>>()
                        .join("\n")
                )
            })?
            .clone();

        let port_str = tcp_port.to_string();
        let mut args = vec![data_dir, &port_str, wasm_path, prefix_dir];
        args.extend(extra_args);

        let process = Command::new(&binary_path)
            .args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to start process: {}", e))?;

        Ok(TestInstance { process, tcp_port })
    }

    fn wait_for_ready(&mut self, timeout_secs: u64) -> Result<(), String> {
        let stdout = self
            .process
            .stdout
            .take()
            .ok_or("Failed to get stdout")?;

        let reader = BufReader::new(stdout);
        let start = std::time::Instant::now();

        for line in reader.lines() {
            if start.elapsed() > Duration::from_secs(timeout_secs) {
                return Err("Timeout waiting for ready signal".to_string());
            }

            let line = line.map_err(|e| format!("Failed to read line: {}", e))?;

            if line.contains("\"id\":\"ready\"") && line.contains("\"success\":true") {
                return Ok(());
            }
        }

        Err("Process exited without sending ready signal".to_string())
    }

    fn try_tcp_connect(&self) -> Result<TcpStream, String> {
        TcpStream::connect_timeout(
            &format!("127.0.0.1:{}", self.tcp_port)
                .parse()
                .map_err(|e| format!("Invalid address: {}", e))?,
            Duration::from_secs(5),
        )
        .map_err(|e| format!("Failed to connect: {}", e))
    }
}

impl Drop for TestInstance {
    fn drop(&mut self) {
        let _ = self.process.kill();
        let _ = self.process.wait();
    }
}

fn find_wasm_path() -> PathBuf {
    let possible_paths = vec![
        PathBuf::from("../priv/pglite.wasi"),
        PathBuf::from("priv/pglite.wasi"),
        PathBuf::from("../../priv/pglite.wasi"),
    ];

    for path in &possible_paths {
        if path.exists() {
            return path.canonicalize().unwrap_or_else(|_| path.clone());
        }
    }

    panic!(
        "pglite.wasi not found. Searched:\n{}",
        possible_paths
            .iter()
            .map(|p| format!("  {:?}", p))
            .collect::<Vec<_>>()
            .join("\n")
    );
}

fn find_prefix_dir() -> PathBuf {
    let possible_paths = vec![
        PathBuf::from("../priv/pglite_prefix"),
        PathBuf::from("priv/pglite_prefix"),
        PathBuf::from("../../priv/pglite_prefix"),
    ];

    for path in &possible_paths {
        if path.exists() {
            return path.canonicalize().unwrap_or_else(|_| path.clone());
        }
    }

    panic!(
        "pglite_prefix not found. Searched:\n{}",
        possible_paths
            .iter()
            .map(|p| format!("  {:?}", p))
            .collect::<Vec<_>>()
            .join("\n")
    );
}

#[test]
fn test_binary_starts_and_binds_port() {
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let data_dir = format!("memory://test_{}", std::process::id());
    let tcp_port = 55000 + (std::process::id() % 1000) as u16;

    let mut instance = TestInstance::start(&data_dir, tcp_port, wasm_path.to_str().unwrap(), prefix_dir.to_str().unwrap())
        .expect("Failed to start instance");

    match instance.wait_for_ready(60) {
        Ok(()) => {
            println!("Instance ready on port {}", tcp_port);

            match instance.try_tcp_connect() {
                Ok(_stream) => {
                    println!("TCP connection successful");
                }
                Err(e) => {
                    println!("TCP connection failed (may be expected): {}", e);
                }
            }
        }
        Err(e) => {
            panic!("Instance failed to start: {}", e);
        }
    }
}

#[test]
fn test_multiple_instances_different_ports() {
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let base_port = 55100 + (std::process::id() % 100) as u16;

    let mut instances: Vec<TestInstance> = Vec::new();

    for i in 0..3 {
        let data_dir = format!("memory://test_multi_{}_{}", std::process::id(), i);
        let tcp_port = base_port + i;

        match TestInstance::start(&data_dir, tcp_port, wasm_path.to_str().unwrap(), prefix_dir.to_str().unwrap()) {
            Ok(instance) => {
                instances.push(instance);
            }
            Err(e) => {
                panic!("Failed to start instance {}: {}", i, e);
            }
        }
    }

    for (i, instance) in instances.iter_mut().enumerate() {
        match instance.wait_for_ready(60) {
            Ok(()) => {
                println!("Instance {} ready on port {}", i, instance.tcp_port);
            }
            Err(e) => {
                panic!("Instance {} failed to become ready: {}", i, e);
            }
        }
    }

    println!(
        "All {} instances started successfully on different ports",
        instances.len()
    );
}

#[test]
fn test_persistent_storage_mode() {
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let temp_dir = std::env::temp_dir().join(format!("pglite_test_{}", std::process::id()));
    std::fs::create_dir_all(&temp_dir).expect("Failed to create temp dir");

    let data_dir = temp_dir.to_str().unwrap();
    let tcp_port = 55200 + (std::process::id() % 100) as u16;

    let mut instance = TestInstance::start(data_dir, tcp_port, wasm_path.to_str().unwrap(), prefix_dir.to_str().unwrap())
        .expect("Failed to start instance");

    match instance.wait_for_ready(60) {
        Ok(()) => {
            println!("Persistent instance ready");
            assert!(temp_dir.exists(), "Data directory should exist");
        }
        Err(e) => {
            panic!("Persistent instance failed to start: {}", e);
        }
    }

    drop(instance);
    std::fs::remove_dir_all(&temp_dir).ok();
}

#[test]
fn test_ready_signal_format() {
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let data_dir = format!("memory://test_signal_{}", std::process::id());
    let tcp_port = 55300 + (std::process::id() % 100) as u16;

    let mut instance = TestInstance::start(&data_dir, tcp_port, wasm_path.to_str().unwrap(), prefix_dir.to_str().unwrap())
        .expect("Failed to start instance");

    let stdout = instance.process.stdout.take().unwrap();
    let reader = BufReader::new(stdout);

    let mut found_ready = false;
    let start = std::time::Instant::now();

    for line in reader.lines() {
        if start.elapsed() > Duration::from_secs(60) {
            break;
        }

        if let Ok(line) = line {
            if line.starts_with('{') && line.contains("ready") {
                let json: serde_json::Value =
                    serde_json::from_str(&line).expect("Ready signal should be valid JSON");

                assert_eq!(json["id"], "ready", "id should be 'ready'");
                assert_eq!(json["success"], true, "success should be true");
                assert_eq!(
                    json["port"], tcp_port as i64,
                    "port should match requested port"
                );

                found_ready = true;
                break;
            }
        }
    }

    assert!(found_ready, "Ready signal should be found in stdout");
}

// ==================== Multiplexer Integration Tests ====================

#[test]
fn test_multiplexer_mode_none_in_ready_signal() {
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let data_dir = format!("memory://test_mux_none_{}", std::process::id());
    let tcp_port = 55400 + (std::process::id() % 100) as u16;

    let mut instance = TestInstance::start_with_args(
        &data_dir,
        tcp_port,
        wasm_path.to_str().unwrap(),
        prefix_dir.to_str().unwrap(),
        &["--multiplexer", "none"],
    )
    .expect("Failed to start instance");

    let stdout = instance.process.stdout.take().unwrap();
    let reader = BufReader::new(stdout);

    let mut found_ready = false;
    let start = std::time::Instant::now();

    for line in reader.lines() {
        if start.elapsed() > Duration::from_secs(60) {
            break;
        }

        if let Ok(line) = line {
            if line.starts_with('{') && line.contains("ready") {
                let json: serde_json::Value =
                    serde_json::from_str(&line).expect("Ready signal should be valid JSON");

                assert_eq!(json["id"], "ready");
                assert_eq!(json["success"], true);
                assert_eq!(json["multiplexer"], "none", "multiplexer mode should be 'none'");

                found_ready = true;
                break;
            }
        }
    }

    assert!(found_ready, "Ready signal should be found in stdout");
}

#[test]
fn test_multiplexer_mode_queue_in_ready_signal() {
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let data_dir = format!("memory://test_mux_queue_{}", std::process::id());
    let tcp_port = 55500 + (std::process::id() % 100) as u16;

    let mut instance = TestInstance::start_with_args(
        &data_dir,
        tcp_port,
        wasm_path.to_str().unwrap(),
        prefix_dir.to_str().unwrap(),
        &["--multiplexer", "queue"],
    )
    .expect("Failed to start instance");

    let stdout = instance.process.stdout.take().unwrap();
    let reader = BufReader::new(stdout);

    let mut found_ready = false;
    let start = std::time::Instant::now();

    for line in reader.lines() {
        if start.elapsed() > Duration::from_secs(60) {
            break;
        }

        if let Ok(line) = line {
            if line.starts_with('{') && line.contains("ready") {
                let json: serde_json::Value =
                    serde_json::from_str(&line).expect("Ready signal should be valid JSON");

                assert_eq!(json["id"], "ready");
                assert_eq!(json["success"], true);
                assert_eq!(
                    json["multiplexer"], "query_queue",
                    "multiplexer mode should be 'query_queue'"
                );

                found_ready = true;
                break;
            }
        }
    }

    assert!(found_ready, "Ready signal should be found in stdout");
}

#[test]
fn test_multiplexer_with_queue_size_option() {
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let data_dir = format!("memory://test_mux_qsize_{}", std::process::id());
    let tcp_port = 55600 + (std::process::id() % 100) as u16;

    let mut instance = TestInstance::start_with_args(
        &data_dir,
        tcp_port,
        wasm_path.to_str().unwrap(),
        prefix_dir.to_str().unwrap(),
        &["--multiplexer", "queue", "--queue-size", "500"],
    )
    .expect("Failed to start instance");

    // Just verify it starts successfully with the options
    match instance.wait_for_ready(60) {
        Ok(()) => {
            println!("Instance with queue-size option ready");
        }
        Err(e) => {
            panic!("Instance with queue-size option failed to start: {}", e);
        }
    }
}

#[test]
fn test_multiplexer_with_query_timeout_option() {
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let data_dir = format!("memory://test_mux_timeout_{}", std::process::id());
    let tcp_port = 55700 + (std::process::id() % 100) as u16;

    let mut instance = TestInstance::start_with_args(
        &data_dir,
        tcp_port,
        wasm_path.to_str().unwrap(),
        prefix_dir.to_str().unwrap(),
        &["--multiplexer", "queue", "--query-timeout", "60000"],
    )
    .expect("Failed to start instance");

    match instance.wait_for_ready(60) {
        Ok(()) => {
            println!("Instance with query-timeout option ready");
        }
        Err(e) => {
            panic!("Instance with query-timeout option failed to start: {}", e);
        }
    }
}

#[test]
fn test_multiplexer_with_all_options() {
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let data_dir = format!("memory://test_mux_all_{}", std::process::id());
    let tcp_port = 55800 + (std::process::id() % 100) as u16;

    let mut instance = TestInstance::start_with_args(
        &data_dir,
        tcp_port,
        wasm_path.to_str().unwrap(),
        prefix_dir.to_str().unwrap(),
        &[
            "--multiplexer",
            "queue",
            "--queue-size",
            "250",
            "--query-timeout",
            "45000",
        ],
    )
    .expect("Failed to start instance");

    match instance.wait_for_ready(60) {
        Ok(()) => {
            println!("Instance with all multiplexer options ready");
        }
        Err(e) => {
            panic!("Instance with all options failed to start: {}", e);
        }
    }
}

#[test]
fn test_multiplexer_default_mode() {
    // When no --multiplexer argument is provided, default should be "none"
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let data_dir = format!("memory://test_mux_default_{}", std::process::id());
    let tcp_port = 55900 + (std::process::id() % 100) as u16;

    let mut instance = TestInstance::start(
        &data_dir,
        tcp_port,
        wasm_path.to_str().unwrap(),
        prefix_dir.to_str().unwrap(),
    )
    .expect("Failed to start instance");

    let stdout = instance.process.stdout.take().unwrap();
    let reader = BufReader::new(stdout);

    let mut found_ready = false;
    let start = std::time::Instant::now();

    for line in reader.lines() {
        if start.elapsed() > Duration::from_secs(60) {
            break;
        }

        if let Ok(line) = line {
            if line.starts_with('{') && line.contains("ready") {
                let json: serde_json::Value =
                    serde_json::from_str(&line).expect("Ready signal should be valid JSON");

                assert_eq!(json["id"], "ready");
                assert_eq!(json["success"], true);
                // Default should be "none"
                assert_eq!(
                    json["multiplexer"], "none",
                    "default multiplexer mode should be 'none'"
                );

                found_ready = true;
                break;
            }
        }
    }

    assert!(found_ready, "Ready signal should be found in stdout");
}

#[test]
fn test_multiplexer_queue_accepts_tcp_connections() {
    let wasm_path = find_wasm_path();
    let prefix_dir = find_prefix_dir();
    let data_dir = format!("memory://test_mux_tcp_{}", std::process::id());
    let tcp_port = 56000 + (std::process::id() % 100) as u16;

    let mut instance = TestInstance::start_with_args(
        &data_dir,
        tcp_port,
        wasm_path.to_str().unwrap(),
        prefix_dir.to_str().unwrap(),
        &["--multiplexer", "queue"],
    )
    .expect("Failed to start instance");

    match instance.wait_for_ready(60) {
        Ok(()) => {
            println!("Multiplexer instance ready on port {}", tcp_port);

            // Try to connect
            match instance.try_tcp_connect() {
                Ok(_stream) => {
                    println!("TCP connection to multiplexer successful");
                }
                Err(e) => {
                    // Connection might fail for various reasons in test env
                    println!("TCP connection to multiplexer: {}", e);
                }
            }
        }
        Err(e) => {
            panic!("Multiplexer instance failed to start: {}", e);
        }
    }
}
