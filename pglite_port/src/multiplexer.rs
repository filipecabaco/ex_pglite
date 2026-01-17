//! Connection Multiplexer for PGLite
//!
//! This module provides a connection multiplexer that accepts multiple PostgreSQL
//! client connections but serializes all queries through a single PGLite backend.
//!
//! Since PGLite only supports one query at a time (due to the WASM store mutex),
//! this multiplexer provides the illusion of concurrent connections by queuing
//! queries and processing them sequentially.
//!
//! # Modes
//!
//! The multiplexer supports different modes that can be extended in the future:
//!
//! - `None` - Direct connection handling (current behavior, one thread per connection)
//! - `QueryQueue` - All queries go through a FIFO queue (Phase 1)
//! - Future: `TransactionAware` - Understands BEGIN/COMMIT/ROLLBACK semantics
//! - Future: `VirtualSessions` - Full session state isolation

use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::str::FromStr;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{mpsc, Arc};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use crate::{create_error_response_from_trap, ensure_server_version, PgliteRuntime};
use anyhow::{Context, Result};

/// Multiplexer mode - extensible for future implementations
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum MultiplexerMode {
    /// No multiplexing - direct thread-per-connection (original behavior)
    #[default]
    None,

    /// Query queue mode - all queries serialized through FIFO queue
    QueryQueue,

    // Future modes (commented out for now):
    // /// Transaction-aware scheduling
    // TransactionAware,
    //
    // /// Full virtual session support
    // VirtualSessions,
}

/// Error type for parsing MultiplexerMode from string
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParseMultiplexerModeError {
    invalid_value: String,
}

impl std::fmt::Display for ParseMultiplexerModeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "invalid multiplexer mode '{}', valid modes: none, queue",
            self.invalid_value
        )
    }
}

impl std::error::Error for ParseMultiplexerModeError {}

impl FromStr for MultiplexerMode {
    type Err = ParseMultiplexerModeError;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "none" | "direct" => Ok(Self::None),
            "queue" | "query_queue" | "queryqueue" => Ok(Self::QueryQueue),
            _ => Err(ParseMultiplexerModeError {
                invalid_value: s.to_string(),
            }),
        }
    }
}

impl MultiplexerMode {
    /// Get mode name for display
    #[must_use]
    pub fn name(&self) -> &'static str {
        match self {
            Self::None => "none",
            Self::QueryQueue => "query_queue",
        }
    }
}

/// Configuration for the multiplexer
#[derive(Debug, Clone)]
pub struct MultiplexerConfig {
    /// The multiplexer mode to use
    pub mode: MultiplexerMode,

    /// Maximum number of queued queries (for QueryQueue mode)
    pub max_queue_size: usize,

    /// Query timeout in milliseconds (0 = no timeout)
    pub query_timeout_ms: u64,
}

impl Default for MultiplexerConfig {
    fn default() -> Self {
        Self {
            mode: MultiplexerMode::None,
            max_queue_size: 1000,
            query_timeout_ms: 30_000,
        }
    }
}

/// A query request from a connection to the executor
struct QueryRequest {
    /// Unique connection identifier (reserved for future transaction-aware scheduling)
    #[allow(dead_code)]
    connection_id: u64,

    /// Raw PostgreSQL wire protocol message
    wire_message: Vec<u8>,

    /// Channel to send the response back
    response_tx: mpsc::Sender<QueryResponse>,
}

/// Response from the executor back to a connection
struct QueryResponse {
    /// The wire protocol response data
    data: Vec<u8>,
}

/// The connection multiplexer
pub struct ConnectionMultiplexer {
    /// Runtime reference (reserved for future virtual session support)
    #[allow(dead_code)]
    runtime: Arc<PgliteRuntime>,

    /// Configuration (max_queue_size reserved for future bounded channel support)
    #[allow(dead_code)]
    config: MultiplexerConfig,

    /// Channel for submitting queries to the executor
    query_tx: mpsc::Sender<QueryRequest>,

    /// The executor thread handle
    executor_handle: Option<JoinHandle<()>>,

    /// Shutdown flag
    shutdown: Arc<AtomicBool>,

    /// Connection ID counter
    next_connection_id: AtomicU64,
}

impl ConnectionMultiplexer {
    /// Create a new connection multiplexer
    pub fn new(runtime: Arc<PgliteRuntime>, config: MultiplexerConfig) -> Self {
        let (query_tx, query_rx) = mpsc::channel();
        let shutdown = Arc::new(AtomicBool::new(false));

        // Spawn the executor thread
        let executor_runtime = Arc::clone(&runtime);
        let executor_shutdown = Arc::clone(&shutdown);

        let executor_handle = thread::spawn(move || {
            Self::executor_loop(executor_runtime, query_rx, executor_shutdown);
        });

        Self {
            runtime,
            config,
            query_tx,
            executor_handle: Some(executor_handle),
            shutdown,
            next_connection_id: AtomicU64::new(1),
        }
    }

    /// The executor loop - processes queries sequentially
    fn executor_loop(
        runtime: Arc<PgliteRuntime>,
        query_rx: mpsc::Receiver<QueryRequest>,
        shutdown: Arc<AtomicBool>,
    ) {
        loop {
            // Check for shutdown
            if shutdown.load(Ordering::SeqCst) {
                break;
            }

            // Try to receive a query with timeout
            match query_rx.recv_timeout(Duration::from_millis(100)) {
                Ok(request) => {
                    // Process the query
                    let response_data = match runtime.process_wire_message(&request.wire_message) {
                        Ok(data) => data,
                        Err(e) => create_error_response_from_trap(&e.to_string()),
                    };

                    // Send response back (ignore errors if connection dropped)
                    let _ = request.response_tx.send(QueryResponse { data: response_data });
                }
                Err(mpsc::RecvTimeoutError::Timeout) => {
                    // No query, continue checking for shutdown
                    continue;
                }
                Err(mpsc::RecvTimeoutError::Disconnected) => {
                    // All senders dropped, exit
                    break;
                }
            }
        }
    }

    /// Allocate a new connection ID
    fn allocate_connection_id(&self) -> u64 {
        self.next_connection_id.fetch_add(1, Ordering::SeqCst)
    }

    /// Handle a client connection using the query queue
    pub fn handle_connection(&self, mut stream: TcpStream) -> Result<()> {
        let connection_id = self.allocate_connection_id();
        stream.set_nodelay(true)?;

        let mut buf = vec![0u8; 64 * 1024];
        let mut has_sent_server_version = false;

        // Create a channel for receiving responses
        let (response_tx, response_rx) = mpsc::channel();

        loop {
            // Check for shutdown
            if self.shutdown.load(Ordering::SeqCst) {
                break;
            }

            // Read from client
            match stream.read(&mut buf) {
                Ok(0) => break, // Connection closed
                Ok(n) => {
                    // Submit query to executor
                    let request = QueryRequest {
                        connection_id,
                        wire_message: buf[..n].to_vec(),
                        response_tx: response_tx.clone(),
                    };

                    if self.query_tx.send(request).is_err() {
                        // Executor shut down
                        break;
                    }

                    // Wait for response
                    let timeout = if self.config.query_timeout_ms > 0 {
                        Duration::from_millis(self.config.query_timeout_ms)
                    } else {
                        Duration::from_secs(3600) // 1 hour max
                    };

                    match response_rx.recv_timeout(timeout) {
                        Ok(response) => {
                            if !response.data.is_empty() {
                                let data =
                                    ensure_server_version(response.data, &mut has_sent_server_version);
                                stream.write_all(&data)?;
                                stream.flush()?;
                            }
                        }
                        Err(mpsc::RecvTimeoutError::Timeout) => {
                            // Query timeout - send error and close
                            let error = create_error_response_from_trap("query timeout exceeded");
                            stream.write_all(&error)?;
                            stream.flush()?;
                            break;
                        }
                        Err(mpsc::RecvTimeoutError::Disconnected) => {
                            // Executor shut down
                            break;
                        }
                    }
                }
                Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(Duration::from_millis(1));
                    continue;
                }
                Err(e) => return Err(e).context("Failed to read from client"),
            }
        }

        Ok(())
    }

    /// Signal shutdown
    pub fn shutdown(&self) {
        self.shutdown.store(true, Ordering::SeqCst);
    }

    /// Wait for the executor to finish
    pub fn join(mut self) {
        self.shutdown();
        if let Some(handle) = self.executor_handle.take() {
            let _ = handle.join();
        }
    }
}

impl Drop for ConnectionMultiplexer {
    fn drop(&mut self) {
        self.shutdown.store(true, Ordering::SeqCst);
        // Note: We don't join here to avoid blocking in drop
    }
}

/// Run the server with the specified multiplexer mode
pub fn run_server(
    runtime: Arc<PgliteRuntime>,
    listener: TcpListener,
    config: MultiplexerConfig,
    shutdown: &'static AtomicBool,
    is_debug: bool,
) -> Result<()> {
    match config.mode {
        MultiplexerMode::None => {
            run_direct_server(runtime, listener, shutdown, is_debug)
        }
        MultiplexerMode::QueryQueue => {
            run_multiplexed_server(runtime, listener, config, shutdown, is_debug)
        }
    }
}

/// Run server with direct connection handling (original behavior)
fn run_direct_server(
    runtime: Arc<PgliteRuntime>,
    listener: TcpListener,
    shutdown: &'static AtomicBool,
    is_debug: bool,
) -> Result<()> {
    listener.set_nonblocking(true)?;
    let mut connection_handles: Vec<JoinHandle<()>> = Vec::new();

    loop {
        if shutdown.load(Ordering::SeqCst) {
            break;
        }

        // Clean up finished connections
        connection_handles.retain(|h| !h.is_finished());

        match listener.accept() {
            Ok((stream, addr)) => {
                if is_debug {
                    eprintln!("[DIRECT] New connection from {:?}", addr);
                }

                let runtime_clone = Arc::clone(&runtime);
                let handle = thread::spawn(move || {
                    if let Err(e) = crate::handle_connection(stream, runtime_clone) {
                        if is_debug {
                            eprintln!("[DIRECT] Connection error from {:?}: {:?}", addr, e);
                        }
                    }
                });
                connection_handles.push(handle);
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                thread::sleep(Duration::from_millis(1));
            }
            Err(e) => {
                if is_debug {
                    eprintln!("[DIRECT] Accept error: {:?}", e);
                }
            }
        }
    }

    // Wait for connections to finish
    for handle in connection_handles {
        let _ = handle.join();
    }

    Ok(())
}

/// Run server with query queue multiplexing
fn run_multiplexed_server(
    runtime: Arc<PgliteRuntime>,
    listener: TcpListener,
    config: MultiplexerConfig,
    shutdown: &'static AtomicBool,
    is_debug: bool,
) -> Result<()> {
    listener.set_nonblocking(true)?;

    // Create the multiplexer
    let multiplexer = Arc::new(ConnectionMultiplexer::new(Arc::clone(&runtime), config));
    let mut connection_handles: Vec<JoinHandle<()>> = Vec::new();

    if is_debug {
        eprintln!("[MULTIPLEXER] Started in QueryQueue mode");
    }

    loop {
        if shutdown.load(Ordering::SeqCst) {
            break;
        }

        // Clean up finished connections
        connection_handles.retain(|h| !h.is_finished());

        match listener.accept() {
            Ok((stream, addr)) => {
                if is_debug {
                    eprintln!("[MULTIPLEXER] New connection from {:?}", addr);
                }

                let mux = Arc::clone(&multiplexer);
                let debug = is_debug;
                let handle = thread::spawn(move || {
                    if let Err(e) = mux.handle_connection(stream) {
                        if debug {
                            eprintln!("[MULTIPLEXER] Connection error from {:?}: {:?}", addr, e);
                        }
                    }
                });
                connection_handles.push(handle);
            }
            Err(ref e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                thread::sleep(Duration::from_millis(1));
            }
            Err(e) => {
                if is_debug {
                    eprintln!("[MULTIPLEXER] Accept error: {:?}", e);
                }
            }
        }
    }

    // Signal multiplexer to shut down
    multiplexer.shutdown();

    // Wait for connections to finish
    for handle in connection_handles {
        let _ = handle.join();
    }

    if is_debug {
        eprintln!("[MULTIPLEXER] Shutdown complete");
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    // ==================== MultiplexerMode Tests ====================

    #[test]
    fn test_multiplexer_mode_from_str_valid() {
        // Test "none" variants
        assert_eq!("none".parse::<MultiplexerMode>().unwrap(), MultiplexerMode::None);
        assert_eq!("direct".parse::<MultiplexerMode>().unwrap(), MultiplexerMode::None);
        assert_eq!("NONE".parse::<MultiplexerMode>().unwrap(), MultiplexerMode::None);
        assert_eq!("Direct".parse::<MultiplexerMode>().unwrap(), MultiplexerMode::None);

        // Test "queue" variants
        assert_eq!("queue".parse::<MultiplexerMode>().unwrap(), MultiplexerMode::QueryQueue);
        assert_eq!("query_queue".parse::<MultiplexerMode>().unwrap(), MultiplexerMode::QueryQueue);
        assert_eq!("queryqueue".parse::<MultiplexerMode>().unwrap(), MultiplexerMode::QueryQueue);
        assert_eq!("QUEUE".parse::<MultiplexerMode>().unwrap(), MultiplexerMode::QueryQueue);
        assert_eq!("Query_Queue".parse::<MultiplexerMode>().unwrap(), MultiplexerMode::QueryQueue);
    }

    #[test]
    fn test_multiplexer_mode_from_str_invalid() {
        let result = "invalid".parse::<MultiplexerMode>();
        assert!(result.is_err());

        let err = result.unwrap_err();
        assert_eq!(err.invalid_value, "invalid");
        assert!(err.to_string().contains("invalid"));
        assert!(err.to_string().contains("none"));
        assert!(err.to_string().contains("queue"));
    }

    #[test]
    fn test_multiplexer_mode_from_str_empty() {
        let result = "".parse::<MultiplexerMode>();
        assert!(result.is_err());
    }

    #[test]
    fn test_multiplexer_mode_name() {
        assert_eq!(MultiplexerMode::None.name(), "none");
        assert_eq!(MultiplexerMode::QueryQueue.name(), "query_queue");
    }

    #[test]
    fn test_multiplexer_mode_default() {
        assert_eq!(MultiplexerMode::default(), MultiplexerMode::None);
    }

    #[test]
    fn test_multiplexer_mode_debug() {
        // Ensure Debug is implemented correctly
        let debug_str = format!("{:?}", MultiplexerMode::QueryQueue);
        assert!(debug_str.contains("QueryQueue"));
    }

    #[test]
    fn test_multiplexer_mode_clone_and_copy() {
        let mode = MultiplexerMode::QueryQueue;
        let cloned = mode.clone();
        let copied = mode;
        assert_eq!(mode, cloned);
        assert_eq!(mode, copied);
    }

    // ==================== MultiplexerConfig Tests ====================

    #[test]
    fn test_multiplexer_config_default() {
        let config = MultiplexerConfig::default();
        assert_eq!(config.mode, MultiplexerMode::None);
        assert_eq!(config.max_queue_size, 1000);
        assert_eq!(config.query_timeout_ms, 30_000);
    }

    #[test]
    fn test_multiplexer_config_custom() {
        let config = MultiplexerConfig {
            mode: MultiplexerMode::QueryQueue,
            max_queue_size: 500,
            query_timeout_ms: 60_000,
        };
        assert_eq!(config.mode, MultiplexerMode::QueryQueue);
        assert_eq!(config.max_queue_size, 500);
        assert_eq!(config.query_timeout_ms, 60_000);
    }

    #[test]
    fn test_multiplexer_config_clone() {
        let config = MultiplexerConfig {
            mode: MultiplexerMode::QueryQueue,
            max_queue_size: 100,
            query_timeout_ms: 5_000,
        };
        let cloned = config.clone();
        assert_eq!(config.mode, cloned.mode);
        assert_eq!(config.max_queue_size, cloned.max_queue_size);
        assert_eq!(config.query_timeout_ms, cloned.query_timeout_ms);
    }

    #[test]
    fn test_multiplexer_config_debug() {
        let config = MultiplexerConfig::default();
        let debug_str = format!("{:?}", config);
        assert!(debug_str.contains("MultiplexerConfig"));
        assert!(debug_str.contains("mode"));
    }

    // ==================== ParseMultiplexerModeError Tests ====================

    #[test]
    fn test_parse_error_display() {
        let err = ParseMultiplexerModeError {
            invalid_value: "foobar".to_string(),
        };
        let display = format!("{}", err);
        assert!(display.contains("foobar"));
        assert!(display.contains("invalid multiplexer mode"));
    }

    #[test]
    fn test_parse_error_debug() {
        let err = ParseMultiplexerModeError {
            invalid_value: "test".to_string(),
        };
        let debug_str = format!("{:?}", err);
        assert!(debug_str.contains("ParseMultiplexerModeError"));
        assert!(debug_str.contains("test"));
    }

    #[test]
    fn test_parse_error_clone() {
        let err = ParseMultiplexerModeError {
            invalid_value: "original".to_string(),
        };
        let cloned = err.clone();
        assert_eq!(err.invalid_value, cloned.invalid_value);
    }

    #[test]
    fn test_parse_error_is_std_error() {
        // Verify it implements std::error::Error
        fn assert_error<E: std::error::Error>(_: &E) {}
        let err = ParseMultiplexerModeError {
            invalid_value: "test".to_string(),
        };
        assert_error(&err);
    }

    // ==================== Query Queue Communication Tests ====================

    #[test]
    fn test_query_response_channel() {
        // Test that the response channel pattern works correctly
        let (response_tx, response_rx) = mpsc::channel::<QueryResponse>();

        // Simulate sending a response
        let test_data = vec![1, 2, 3, 4, 5];
        response_tx
            .send(QueryResponse {
                data: test_data.clone(),
            })
            .unwrap();

        // Verify we can receive it
        let received = response_rx.recv().unwrap();
        assert_eq!(received.data, test_data);
    }

    #[test]
    fn test_query_request_channel() {
        // Test that the request channel pattern works correctly
        let (query_tx, query_rx) = mpsc::channel::<QueryRequest>();
        let (response_tx, _response_rx) = mpsc::channel::<QueryResponse>();

        // Simulate sending a request
        let test_message = vec![b'Q', 0, 0, 0, 10, b'S', b'E', b'L', b'E', b'C', b'T', b' ', b'1', 0];
        query_tx
            .send(QueryRequest {
                connection_id: 42,
                wire_message: test_message.clone(),
                response_tx,
            })
            .unwrap();

        // Verify we can receive it
        let received = query_rx.recv().unwrap();
        assert_eq!(received.connection_id, 42);
        assert_eq!(received.wire_message, test_message);
    }

    #[test]
    fn test_channel_timeout() {
        let (_tx, rx) = mpsc::channel::<QueryResponse>();

        // Should timeout since no one is sending
        let result = rx.recv_timeout(Duration::from_millis(10));
        assert!(matches!(result, Err(mpsc::RecvTimeoutError::Timeout)));
    }

    #[test]
    fn test_channel_disconnected() {
        let (tx, rx) = mpsc::channel::<QueryResponse>();

        // Drop sender
        drop(tx);

        // Should get disconnected error
        let result = rx.recv_timeout(Duration::from_millis(10));
        assert!(matches!(result, Err(mpsc::RecvTimeoutError::Disconnected)));
    }

    // ==================== Connection ID Tests ====================

    #[test]
    fn test_connection_id_counter() {
        let counter = AtomicU64::new(1);

        let id1 = counter.fetch_add(1, Ordering::SeqCst);
        let id2 = counter.fetch_add(1, Ordering::SeqCst);
        let id3 = counter.fetch_add(1, Ordering::SeqCst);

        assert_eq!(id1, 1);
        assert_eq!(id2, 2);
        assert_eq!(id3, 3);
    }

    // ==================== Shutdown Flag Tests ====================

    #[test]
    fn test_shutdown_flag() {
        let shutdown = Arc::new(AtomicBool::new(false));

        assert!(!shutdown.load(Ordering::SeqCst));

        shutdown.store(true, Ordering::SeqCst);
        assert!(shutdown.load(Ordering::SeqCst));
    }

    #[test]
    fn test_shutdown_flag_shared() {
        let shutdown = Arc::new(AtomicBool::new(false));
        let shutdown_clone = Arc::clone(&shutdown);

        // Set from one reference
        shutdown.store(true, Ordering::SeqCst);

        // Should be visible from the other
        assert!(shutdown_clone.load(Ordering::SeqCst));
    }
}
