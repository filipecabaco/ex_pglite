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

impl MultiplexerMode {
    /// Parse mode from string argument
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "none" | "direct" => Some(Self::None),
            "queue" | "query_queue" | "queryqueue" => Some(Self::QueryQueue),
            _ => None,
        }
    }

    /// Get mode name for display
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
                let handle = thread::spawn(move || {
                    if let Err(e) = mux.handle_connection(stream) {
                        eprintln!("[MULTIPLEXER] Connection error from {:?}: {:?}", addr, e);
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

    #[test]
    fn test_multiplexer_mode_from_str() {
        assert_eq!(MultiplexerMode::from_str("none"), Some(MultiplexerMode::None));
        assert_eq!(MultiplexerMode::from_str("direct"), Some(MultiplexerMode::None));
        assert_eq!(MultiplexerMode::from_str("queue"), Some(MultiplexerMode::QueryQueue));
        assert_eq!(MultiplexerMode::from_str("query_queue"), Some(MultiplexerMode::QueryQueue));
        assert_eq!(MultiplexerMode::from_str("queryqueue"), Some(MultiplexerMode::QueryQueue));
        assert_eq!(MultiplexerMode::from_str("QUEUE"), Some(MultiplexerMode::QueryQueue));
        assert_eq!(MultiplexerMode::from_str("invalid"), None);
    }

    #[test]
    fn test_multiplexer_mode_name() {
        assert_eq!(MultiplexerMode::None.name(), "none");
        assert_eq!(MultiplexerMode::QueryQueue.name(), "query_queue");
    }

    #[test]
    fn test_multiplexer_config_default() {
        let config = MultiplexerConfig::default();
        assert_eq!(config.mode, MultiplexerMode::None);
        assert_eq!(config.max_queue_size, 1000);
        assert_eq!(config.query_timeout_ms, 30_000);
    }
}
