# PGLite Connection Multiplexer Research: Rust-Level Solutions

## Problem Statement

PGLite (PostgreSQL compiled to WebAssembly) has a fundamental limitation: **it only supports a single connection at a time**. This is due to:

1. The WASM store mutex (`Arc<Mutex<Store<WasiP1Ctx>>>`) that serializes all queries
2. A single shared 64KB buffer for query/response data
3. No multi-process architecture in the WASM runtime

This document focuses on **Rust-level solutions** implemented in `pglite_port` that would work across all language bindings (Elixir, Python, Node.js, Go, etc.).

---

## Current Architecture Analysis

### Bottleneck Location

The serialization happens in `lib.rs:499-520`:

```rust
pub fn process_wire_message(&self, data: &[u8]) -> Result<Vec<u8>> {
    let mut store = self.store.lock().unwrap();  // <-- ALL QUERIES SERIALIZE HERE

    self.write_to_buffer_locked(&mut store, data)?;
    self.interactive_write_locked(&mut store, data.len())?;
    // ... query execution ...
}
```

### Current Connection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       main.rs:189                               │
│                                                                 │
│   loop {                                                        │
│       match listener.accept() {                                 │
│           Ok((stream, addr)) => {                              │
│               let runtime = Arc::clone(&runtime);               │
│               std::thread::spawn(move || {                      │
│                   handle_connection(stream, runtime)  ──────┐  │
│               });                                            │  │
│           }                                                  │  │
│       }                                                      │  │
│   }                                                          │  │
└──────────────────────────────────────────────────────────────┼──┘
                                                               │
                                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       lib.rs:643-669                            │
│                                                                 │
│   pub fn handle_connection(stream, runtime) {                   │
│       loop {                                                    │
│           let n = stream.read(&mut buf)?;                       │
│           let response = runtime.process_wire_message(&buf)?; ─┐│
│           stream.write_all(&response)?;                        ││
│       }                                                        ││
│   }                                                            ││
└────────────────────────────────────────────────────────────────┼┘
                                                                 │
                                                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       lib.rs:499-520                            │
│                                                                 │
│   pub fn process_wire_message(&self, data) -> Vec<u8> {         │
│       let mut store = self.store.lock().unwrap();  // MUTEX!   │
│       // ... Only ONE query executes at a time ...             │
│   }                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Proposed Rust-Level Solutions

### Solution 1: Async Query Queue (Recommended First Step)

Replace the thread-per-connection model with an async runtime that queues queries.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TCP Connections                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Client 1 │  │ Client 2 │  │ Client 3 │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
└───────┼─────────────┼─────────────┼────────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Tokio Async Runtime (NEW)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Connection Handler Tasks (per connection)        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │  │
│  │  │ Task 1  │  │ Task 2  │  │ Task 3  │                   │  │
│  │  │(waiting)│  │(waiting)│  │(waiting)│                   │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘                   │  │
│  └───────┼───────────┼───────────┼──────────────────────────┘  │
│          │           │           │                              │
│          ▼           ▼           ▼                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MPSC Query Queue                             │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  QueryRequest { conn_id, wire_msg, response_tx }   │  │  │
│  │  │  QueryRequest { conn_id, wire_msg, response_tx }   │  │  │
│  │  │  QueryRequest { conn_id, wire_msg, response_tx }   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Query Executor (Single Task)                 │  │
│  │                                                           │  │
│  │  loop {                                                   │  │
│  │      let req = queue.recv().await;                       │  │
│  │      let response = runtime.process_wire_message(req);   │  │
│  │      req.response_tx.send(response);                     │  │
│  │  }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

```rust
// New file: src/multiplexer.rs

use tokio::sync::{mpsc, oneshot};
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use std::sync::Arc;

/// A query request sent from a connection handler to the executor
pub struct QueryRequest {
    /// Unique connection identifier
    pub connection_id: u64,
    /// Raw PostgreSQL wire protocol message
    pub wire_message: Vec<u8>,
    /// Channel to send the response back
    pub response_tx: oneshot::Sender<Vec<u8>>,
}

/// The connection multiplexer that manages all connections
pub struct ConnectionMultiplexer {
    runtime: Arc<PgliteRuntime>,
    query_tx: mpsc::Sender<QueryRequest>,
}

impl ConnectionMultiplexer {
    pub fn new(runtime: Arc<PgliteRuntime>, queue_size: usize) -> (Self, mpsc::Receiver<QueryRequest>) {
        let (query_tx, query_rx) = mpsc::channel(queue_size);
        (Self { runtime, query_tx }, query_rx)
    }

    /// Spawn the query executor task - processes queries sequentially
    pub fn spawn_executor(runtime: Arc<PgliteRuntime>, mut query_rx: mpsc::Receiver<QueryRequest>) {
        tokio::spawn(async move {
            while let Some(request) = query_rx.recv().await {
                // Process query on the single PGLite backend
                let response = runtime.process_wire_message(&request.wire_message)
                    .unwrap_or_else(|e| create_error_response(&e.to_string()));

                // Send response back to waiting connection
                let _ = request.response_tx.send(response);
            }
        });
    }

    /// Handle a single client connection
    pub async fn handle_connection(
        mut stream: TcpStream,
        connection_id: u64,
        query_tx: mpsc::Sender<QueryRequest>,
    ) -> Result<()> {
        stream.set_nodelay(true)?;
        let mut buf = vec![0u8; 64 * 1024];
        let mut has_sent_server_version = false;

        loop {
            let n = match stream.read(&mut buf).await {
                Ok(0) => break,  // Connection closed
                Ok(n) => n,
                Err(e) => return Err(e.into()),
            };

            // Create response channel
            let (response_tx, response_rx) = oneshot::channel();

            // Send query to executor
            let request = QueryRequest {
                connection_id,
                wire_message: buf[..n].to_vec(),
                response_tx,
            };

            query_tx.send(request).await
                .map_err(|_| anyhow::anyhow!("Query executor shut down"))?;

            // Wait for response
            let response = response_rx.await
                .map_err(|_| anyhow::anyhow!("Query executor dropped response"))?;

            if !response.is_empty() {
                let response = ensure_server_version(response, &mut has_sent_server_version);
                stream.write_all(&response).await?;
                stream.flush().await?;
            }
        }

        Ok(())
    }
}

/// Main entry point with async runtime
pub async fn run_multiplexed_server(runtime: Arc<PgliteRuntime>, port: u16) -> Result<()> {
    let listener = TcpListener::bind(("127.0.0.1", port)).await?;

    // Create multiplexer with queue
    let (multiplexer, query_rx) = ConnectionMultiplexer::new(Arc::clone(&runtime), 1000);

    // Spawn the single query executor
    ConnectionMultiplexer::spawn_executor(runtime, query_rx);

    let mut connection_id: u64 = 0;

    loop {
        let (stream, addr) = listener.accept().await?;
        connection_id += 1;

        let query_tx = multiplexer.query_tx.clone();
        let conn_id = connection_id;

        tokio::spawn(async move {
            if let Err(e) = ConnectionMultiplexer::handle_connection(stream, conn_id, query_tx).await {
                eprintln!("Connection {} error: {:?}", conn_id, e);
            }
        });
    }
}
```

#### Cargo.toml Changes

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
# ... existing deps
```

---

### Solution 2: Transaction-Aware Scheduler

Builds on Solution 1 by understanding PostgreSQL transaction semantics.

#### Key Insight

- Only ONE connection can have an active transaction at a time
- Non-transactional queries can be freely interleaved
- Transaction state must be tracked per-connection

#### Implementation

```rust
// src/transaction_scheduler.rs

use std::collections::{HashMap, VecDeque};

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum TransactionState {
    Idle,           // No active transaction
    InTransaction,  // BEGIN executed, waiting for COMMIT/ROLLBACK
    Failed,         // Transaction aborted, needs ROLLBACK
}

#[derive(Debug)]
pub struct ConnectionState {
    pub id: u64,
    pub transaction_state: TransactionState,
    pub pending_queries: VecDeque<PendingQuery>,
}

pub struct PendingQuery {
    pub wire_message: Vec<u8>,
    pub response_tx: oneshot::Sender<Vec<u8>>,
}

pub struct TransactionScheduler {
    runtime: Arc<PgliteRuntime>,
    connections: HashMap<u64, ConnectionState>,

    /// Connection ID that currently owns the transaction lock (if any)
    transaction_owner: Option<u64>,

    /// Queue of connections waiting to start a transaction
    transaction_waiters: VecDeque<u64>,
}

impl TransactionScheduler {
    pub fn new(runtime: Arc<PgliteRuntime>) -> Self {
        Self {
            runtime,
            connections: HashMap::new(),
            transaction_owner: None,
            transaction_waiters: VecDeque::new(),
        }
    }

    /// Process a query from a connection
    pub fn process_query(&mut self, conn_id: u64, wire_message: &[u8]) -> QueryResult {
        let query_type = self.detect_query_type(wire_message);

        match query_type {
            QueryType::Begin => self.handle_begin(conn_id, wire_message),
            QueryType::Commit | QueryType::Rollback => self.handle_end_transaction(conn_id, wire_message),
            QueryType::Other => self.handle_regular_query(conn_id, wire_message),
        }
    }

    fn handle_begin(&mut self, conn_id: u64, wire_message: &[u8]) -> QueryResult {
        match self.transaction_owner {
            None => {
                // No active transaction, this connection gets it
                self.transaction_owner = Some(conn_id);
                self.update_connection_state(conn_id, TransactionState::InTransaction);
                self.execute_immediately(wire_message)
            }
            Some(owner) if owner == conn_id => {
                // This connection already owns the transaction (nested BEGIN)
                // PostgreSQL ignores nested BEGIN, just execute it
                self.execute_immediately(wire_message)
            }
            Some(_other) => {
                // Another connection owns the transaction, queue this one
                QueryResult::Queued
            }
        }
    }

    fn handle_end_transaction(&mut self, conn_id: u64, wire_message: &[u8]) -> QueryResult {
        if self.transaction_owner == Some(conn_id) {
            let result = self.execute_immediately(wire_message);

            // Release transaction lock
            self.transaction_owner = None;
            self.update_connection_state(conn_id, TransactionState::Idle);

            // Wake up next waiting connection
            self.process_next_waiter();

            result
        } else {
            // Not in a transaction or wrong connection
            self.execute_immediately(wire_message)  // Let PostgreSQL return the error
        }
    }

    fn handle_regular_query(&mut self, conn_id: u64, wire_message: &[u8]) -> QueryResult {
        match self.transaction_owner {
            None => {
                // No active transaction, execute immediately
                self.execute_immediately(wire_message)
            }
            Some(owner) if owner == conn_id => {
                // This connection owns the transaction, execute immediately
                self.execute_immediately(wire_message)
            }
            Some(_other) => {
                // Another connection owns the transaction
                // Queue this query until the transaction completes
                QueryResult::Queued
            }
        }
    }

    fn detect_query_type(&self, wire_message: &[u8]) -> QueryType {
        // Parse the wire message to detect BEGIN/COMMIT/ROLLBACK
        // This is a simplified version - full implementation needs to handle
        // prepared statements, extended query protocol, etc.

        if wire_message.is_empty() || wire_message[0] != b'Q' {
            return QueryType::Other;
        }

        // Skip message type and length to get query text
        if wire_message.len() < 6 {
            return QueryType::Other;
        }

        let query_start = 5;
        let query = &wire_message[query_start..];
        let query_upper: String = query.iter()
            .take_while(|&&b| b != 0)
            .map(|&b| (b as char).to_ascii_uppercase())
            .collect();

        let trimmed = query_upper.trim_start();

        if trimmed.starts_with("BEGIN") || trimmed.starts_with("START TRANSACTION") {
            QueryType::Begin
        } else if trimmed.starts_with("COMMIT") || trimmed.starts_with("END") {
            QueryType::Commit
        } else if trimmed.starts_with("ROLLBACK") || trimmed.starts_with("ABORT") {
            QueryType::Rollback
        } else {
            QueryType::Other
        }
    }

    fn execute_immediately(&self, wire_message: &[u8]) -> QueryResult {
        match self.runtime.process_wire_message(wire_message) {
            Ok(response) => QueryResult::Response(response),
            Err(e) => QueryResult::Response(create_error_response(&e.to_string())),
        }
    }

    fn process_next_waiter(&mut self) {
        if let Some(next_conn_id) = self.transaction_waiters.pop_front() {
            if let Some(conn_state) = self.connections.get_mut(&next_conn_id) {
                if let Some(pending) = conn_state.pending_queries.pop_front() {
                    // Execute the pending BEGIN
                    self.transaction_owner = Some(next_conn_id);
                    conn_state.transaction_state = TransactionState::InTransaction;

                    let response = self.execute_immediately(&pending.wire_message);
                    if let QueryResult::Response(data) = response {
                        let _ = pending.response_tx.send(data);
                    }
                }
            }
        }
    }
}

#[derive(Debug)]
pub enum QueryType {
    Begin,
    Commit,
    Rollback,
    Other,
}

pub enum QueryResult {
    Response(Vec<u8>),
    Queued,
}
```

---

### Solution 3: Virtual PostgreSQL Sessions

Full session state tracking to emulate multiple independent PostgreSQL sessions.

#### Session State to Track

```rust
// src/virtual_session.rs

use std::collections::HashMap;

/// Represents a virtual PostgreSQL session
#[derive(Debug, Clone)]
pub struct VirtualSession {
    pub id: u64,

    // Session variables (SET commands)
    pub search_path: String,
    pub timezone: String,
    pub client_encoding: String,
    pub application_name: String,
    pub statement_timeout: u32,
    pub lock_timeout: u32,
    pub work_mem: String,

    // Custom GUC variables
    pub custom_variables: HashMap<String, String>,

    // Transaction state
    pub transaction_state: TransactionState,
    pub savepoints: Vec<String>,

    // Prepared statements (name -> SQL definition)
    pub prepared_statements: HashMap<String, PreparedStatement>,

    // Cursors (name -> cursor state)
    pub cursors: HashMap<String, CursorState>,

    // Listen/Notify channels
    pub listen_channels: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct PreparedStatement {
    pub name: String,
    pub sql: String,
    pub param_types: Vec<u32>,  // OIDs
}

#[derive(Debug, Clone)]
pub struct CursorState {
    pub name: String,
    pub query: String,
    pub position: u64,
    pub is_holdable: bool,
}

impl VirtualSession {
    pub fn new(id: u64) -> Self {
        Self {
            id,
            search_path: "\"$user\", public".to_string(),
            timezone: "UTC".to_string(),
            client_encoding: "UTF8".to_string(),
            application_name: String::new(),
            statement_timeout: 0,
            lock_timeout: 0,
            work_mem: "4MB".to_string(),
            custom_variables: HashMap::new(),
            transaction_state: TransactionState::Idle,
            savepoints: Vec::new(),
            prepared_statements: HashMap::new(),
            cursors: HashMap::new(),
            listen_channels: Vec::new(),
        }
    }

    /// Generate SQL to restore this session's state
    pub fn generate_restore_sql(&self) -> String {
        let mut statements = Vec::new();

        // Restore session variables
        statements.push(format!("SET search_path TO {}", self.search_path));
        statements.push(format!("SET timezone TO '{}'", self.timezone));
        statements.push(format!("SET client_encoding TO '{}'", self.client_encoding));

        if !self.application_name.is_empty() {
            statements.push(format!("SET application_name TO '{}'", self.application_name));
        }

        if self.statement_timeout > 0 {
            statements.push(format!("SET statement_timeout TO {}", self.statement_timeout));
        }

        // Restore custom variables
        for (name, value) in &self.custom_variables {
            statements.push(format!("SET {} TO '{}'", name, value));
        }

        // Restore prepared statements
        for (name, stmt) in &self.prepared_statements {
            statements.push(format!("PREPARE {} AS {}", name, stmt.sql));
        }

        // Restore LISTEN channels
        for channel in &self.listen_channels {
            statements.push(format!("LISTEN {}", channel));
        }

        statements.join("; ")
    }
}

/// Session manager that handles context switching
pub struct SessionManager {
    runtime: Arc<PgliteRuntime>,
    sessions: HashMap<u64, VirtualSession>,
    current_session: Option<u64>,
}

impl SessionManager {
    pub fn new(runtime: Arc<PgliteRuntime>) -> Self {
        Self {
            runtime,
            sessions: HashMap::new(),
            current_session: None,
        }
    }

    /// Create a new virtual session
    pub fn create_session(&mut self) -> u64 {
        let id = self.sessions.len() as u64 + 1;
        self.sessions.insert(id, VirtualSession::new(id));
        id
    }

    /// Switch to a different session, restoring its state
    pub fn switch_to_session(&mut self, session_id: u64) -> Result<()> {
        if self.current_session == Some(session_id) {
            return Ok(());  // Already on this session
        }

        // Save current session state if any
        if let Some(current_id) = self.current_session {
            self.save_session_state(current_id)?;
        }

        // Restore new session state
        if let Some(session) = self.sessions.get(&session_id) {
            let restore_sql = session.generate_restore_sql();
            if !restore_sql.is_empty() {
                // Execute restore SQL internally
                self.execute_internal(&restore_sql)?;
            }
        }

        self.current_session = Some(session_id);
        Ok(())
    }

    /// Process a query for a specific session
    pub fn process_query(&mut self, session_id: u64, wire_message: &[u8]) -> Result<Vec<u8>> {
        // Switch to the session if needed
        self.switch_to_session(session_id)?;

        // Execute the query
        let response = self.runtime.process_wire_message(wire_message)?;

        // Update session state based on the query and response
        self.update_session_from_query(session_id, wire_message, &response)?;

        Ok(response)
    }

    fn update_session_from_query(&mut self, session_id: u64, wire_message: &[u8], response: &[u8]) -> Result<()> {
        // Parse wire message to detect:
        // - SET commands -> update session variables
        // - PREPARE -> add to prepared_statements
        // - DEALLOCATE -> remove from prepared_statements
        // - DECLARE CURSOR -> add to cursors
        // - CLOSE -> remove from cursors
        // - LISTEN -> add to listen_channels
        // - UNLISTEN -> remove from listen_channels
        // - BEGIN/COMMIT/ROLLBACK -> update transaction_state
        // - SAVEPOINT/RELEASE/ROLLBACK TO -> update savepoints

        // This is a simplified version - full implementation needs wire protocol parsing

        if let Some(session) = self.sessions.get_mut(&session_id) {
            // Update transaction state from ReadyForQuery response
            if let Some(tx_status) = self.extract_transaction_status(response) {
                session.transaction_state = tx_status;
            }
        }

        Ok(())
    }

    fn extract_transaction_status(&self, response: &[u8]) -> Option<TransactionState> {
        // Find ReadyForQuery message and extract transaction status
        for msg in WireMessageIter::new(response) {
            if msg.msg_type == b'Z' && !msg.payload.is_empty() {
                return match msg.payload[0] {
                    b'I' => Some(TransactionState::Idle),
                    b'T' => Some(TransactionState::InTransaction),
                    b'E' => Some(TransactionState::Failed),
                    _ => None,
                };
            }
        }
        None
    }
}
```

---

### Solution 4: Priority Queue with Fair Scheduling

For scenarios where some queries need priority (e.g., heartbeats, admin queries).

```rust
// src/priority_scheduler.rs

use std::collections::BinaryHeap;
use std::cmp::Ordering;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QueryPriority {
    /// System queries (health checks, pg_stat, etc.)
    System = 3,
    /// Interactive queries from users
    Interactive = 2,
    /// Background/batch queries
    Background = 1,
}

pub struct PrioritizedQuery {
    pub priority: QueryPriority,
    pub timestamp: std::time::Instant,
    pub connection_id: u64,
    pub wire_message: Vec<u8>,
    pub response_tx: oneshot::Sender<Vec<u8>>,
}

impl Ord for PrioritizedQuery {
    fn cmp(&self, other: &Self) -> Ordering {
        // Higher priority first, then earlier timestamp
        match (self.priority as u8).cmp(&(other.priority as u8)) {
            Ordering::Equal => other.timestamp.cmp(&self.timestamp),  // Earlier is better
            other => other,
        }
    }
}

impl PartialOrd for PrioritizedQuery {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

pub struct PriorityScheduler {
    runtime: Arc<PgliteRuntime>,
    queue: Mutex<BinaryHeap<PrioritizedQuery>>,

    /// Fair scheduling: track last execution time per connection
    last_execution: Mutex<HashMap<u64, std::time::Instant>>,

    /// Maximum queries per connection in a scheduling window
    max_queries_per_window: u32,
    window_duration: std::time::Duration,
}

impl PriorityScheduler {
    /// Detect query priority based on content
    pub fn detect_priority(wire_message: &[u8]) -> QueryPriority {
        // Parse query to determine priority
        if let Some(query) = Self::extract_query_text(wire_message) {
            let upper = query.to_uppercase();

            // System queries
            if upper.contains("PG_STAT")
                || upper.contains("PG_CATALOG")
                || upper.starts_with("SELECT 1")  // Health check
                || upper.contains("PG_IS_IN_RECOVERY") {
                return QueryPriority::System;
            }

            // Background queries (typically large scans, VACUUM, etc.)
            if upper.starts_with("VACUUM")
                || upper.starts_with("ANALYZE")
                || upper.starts_with("REINDEX")
                || upper.contains("COPY") {
                return QueryPriority::Background;
            }
        }

        QueryPriority::Interactive
    }
}
```

---

### Solution 5: Connection Coalescing / Batching

Batch multiple queries into a single execution for efficiency.

```rust
// src/query_batcher.rs

use std::time::Duration;

pub struct QueryBatcher {
    runtime: Arc<PgliteRuntime>,
    batch_window: Duration,
    max_batch_size: usize,
    pending: Mutex<Vec<BatchedQuery>>,
}

struct BatchedQuery {
    connection_id: u64,
    wire_message: Vec<u8>,
    response_tx: oneshot::Sender<Vec<u8>>,
    received_at: std::time::Instant,
}

impl QueryBatcher {
    pub fn new(runtime: Arc<PgliteRuntime>, batch_window_ms: u64, max_batch_size: usize) -> Self {
        Self {
            runtime,
            batch_window: Duration::from_millis(batch_window_ms),
            max_batch_size,
            pending: Mutex::new(Vec::new()),
        }
    }

    /// Add a query to the batch
    pub fn submit(&self, conn_id: u64, wire_message: Vec<u8>, response_tx: oneshot::Sender<Vec<u8>>) {
        let mut pending = self.pending.lock().unwrap();
        pending.push(BatchedQuery {
            connection_id: conn_id,
            wire_message,
            response_tx,
            received_at: std::time::Instant::now(),
        });

        // Execute immediately if batch is full
        if pending.len() >= self.max_batch_size {
            drop(pending);
            self.execute_batch();
        }
    }

    /// Execute pending batch (called by timer or when full)
    pub fn execute_batch(&self) {
        let queries: Vec<_> = {
            let mut pending = self.pending.lock().unwrap();
            std::mem::take(&mut *pending)
        };

        if queries.is_empty() {
            return;
        }

        // For simple SELECT queries, we could potentially use UNION ALL
        // But for safety, execute sequentially
        for query in queries {
            let response = self.runtime.process_wire_message(&query.wire_message)
                .unwrap_or_else(|e| create_error_response(&e.to_string()));
            let _ = query.response_tx.send(response);
        }
    }

    /// Spawn background task to flush batches periodically
    pub fn spawn_flush_task(self: Arc<Self>) {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(self.batch_window);
            loop {
                interval.tick().await;
                self.execute_batch();
            }
        });
    }
}
```

---

## Comparison Matrix

| Solution | Complexity | Latency | Transaction Support | Session Isolation | Language Agnostic |
|----------|------------|---------|---------------------|-------------------|-------------------|
| 1. Async Queue | Low | Low | None | None | ✅ Yes |
| 2. Transaction Scheduler | Medium | Low | Full | Partial | ✅ Yes |
| 3. Virtual Sessions | High | Medium | Full | Full | ✅ Yes |
| 4. Priority Queue | Medium | Variable | None | None | ✅ Yes |
| 5. Query Batching | Low | Higher | None | None | ✅ Yes |

---

## Recommended Implementation Path

### Phase 1: Query Queue (Foundation) - ✅ COMPLETED

**Status:** Implemented using `std` library only (no external dependencies like tokio).

**What was implemented:**
1. `src/multiplexer.rs` - Connection multiplexer with query queue
2. `MultiplexerMode` enum - Extensible for future modes (None, QueryQueue)
3. `MultiplexerConfig` struct - Configuration options
4. MPSC-based query queue using `std::sync::mpsc`
5. Command-line arguments for configuration

**Usage:**
```bash
# Direct mode (original behavior)
pglite_port <data_dir> <port> <wasm> <prefix> --multiplexer none

# Query queue mode (new multiplexer)
pglite_port <data_dir> <port> <wasm> <prefix> --multiplexer queue

# With options
pglite_port <data_dir> <port> <wasm> <prefix> \
  --multiplexer queue \
  --queue-size 500 \
  --query-timeout 60000
```

**Files modified:**
- `src/multiplexer.rs` - new file with multiplexer implementation
- `src/lib.rs` - exports multiplexer module
- `src/main.rs` - argument parsing and mode selection

### Phase 2: Transaction Awareness

1. Add query type detection (BEGIN/COMMIT/ROLLBACK parsing)
2. Implement transaction locking
3. Add connection state tracking
4. Implement waiter queue for transactions

**New files:**
- `src/transaction_scheduler.rs`
- `src/wire_parser.rs` (extract query text from wire protocol)

### Phase 3: Virtual Sessions (Optional, for full compatibility)

1. Implement session state struct
2. Add SET command interception
3. Implement session context switching
4. Add prepared statement tracking

**New files:**
- `src/virtual_session.rs`
- `src/session_manager.rs`

---

## Configuration Options

**Implemented** - `MultiplexerConfig` struct:

```rust
/// Multiplexer mode - extensible for future implementations
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum MultiplexerMode {
    #[default]
    None,       // Direct thread-per-connection (original behavior)
    QueryQueue, // Query queue serialization
    // Future: TransactionAware, VirtualSessions
}

/// Configuration for the multiplexer
#[derive(Debug, Clone)]
pub struct MultiplexerConfig {
    /// The multiplexer mode to use
    pub mode: MultiplexerMode,

    /// Maximum number of queued queries (for QueryQueue mode)
    pub max_queue_size: usize,  // default: 1000

    /// Query timeout in milliseconds (0 = no timeout)
    pub query_timeout_ms: u64,  // default: 30000
}
```

**Command-line arguments:**
- `--multiplexer <mode>` - Select mode: `none`, `queue`
- `--queue-size <n>` - Max queued queries
- `--query-timeout <ms>` - Query timeout

**Future configuration options** (to be added in later phases):
- `transaction_aware: bool` - Enable transaction-aware scheduling
- `virtual_sessions: bool` - Enable virtual session support
- `batch_window_ms: u64` - Query batch window

---

## Wire Protocol Considerations

### Detecting Query Type

The PostgreSQL wire protocol uses these message types:

| Message | Type Byte | Description |
|---------|-----------|-------------|
| Query | `Q` | Simple query (contains SQL text) |
| Parse | `P` | Prepare statement |
| Bind | `B` | Bind parameters |
| Execute | `E` | Execute prepared statement |
| Sync | `S` | Sync point |
| Terminate | `X` | Close connection |

For transaction detection, we need to:

1. Parse `Q` messages to find BEGIN/COMMIT/ROLLBACK
2. Track prepared statement names from `P` messages
3. Watch for `Parse` with transaction-starting SQL

```rust
/// Parse a Simple Query message to extract SQL text
fn extract_simple_query(wire_message: &[u8]) -> Option<&str> {
    if wire_message.is_empty() || wire_message[0] != b'Q' {
        return None;
    }
    if wire_message.len() < 6 {
        return None;
    }

    // Skip type (1 byte) + length (4 bytes)
    let query_bytes = &wire_message[5..];

    // Find null terminator
    let end = query_bytes.iter().position(|&b| b == 0)?;

    std::str::from_utf8(&query_bytes[..end]).ok()
}
```

---

## Testing Strategy

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_query_queue_ordering() {
        // Verify FIFO ordering of queries
    }

    #[tokio::test]
    async fn test_transaction_locking() {
        // Verify only one transaction at a time
    }

    #[tokio::test]
    async fn test_session_isolation() {
        // Verify SET commands don't leak between sessions
    }

    #[tokio::test]
    async fn test_concurrent_connections() {
        // Stress test with many concurrent connections
    }
}
```

### Integration Tests (Elixir)

```elixir
defmodule Pglite.MultiplexerTest do
  use ExUnit.Case

  test "multiple connections can query concurrently" do
    {:ok, pglite} = Pglite.start_link()

    # Start 10 concurrent connections
    tasks = for i <- 1..10 do
      Task.async(fn ->
        {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
        {:ok, result} = Postgrex.query(conn, "SELECT $1::int", [i])
        GenServer.stop(conn)
        result.rows
      end)
    end

    results = Task.await_many(tasks, 30_000)
    assert length(results) == 10
  end

  test "transactions are properly isolated" do
    {:ok, pglite} = Pglite.start_link()

    # Connection 1 starts a transaction
    {:ok, conn1} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
    Postgrex.query!(conn1, "BEGIN", [])
    Postgrex.query!(conn1, "CREATE TABLE test (id int)", [])

    # Connection 2 should not see the table (or wait for transaction)
    {:ok, conn2} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
    result = Postgrex.query(conn2, "SELECT * FROM test", [])

    # Depending on implementation:
    # - With transaction scheduling: conn2 waits
    # - Without: conn2 sees error (table doesn't exist yet)

    Postgrex.query!(conn1, "COMMIT", [])

    # Now conn2 should see the table
    {:ok, _} = Postgrex.query(conn2, "SELECT * FROM test", [])
  end
end
```

---

## References

- [PGlite Socket Documentation](https://pglite.dev/docs/pglite-socket)
- [PGlite Multi-Tab Worker](https://pglite.dev/docs/multi-tab-worker)
- [PostgreSQL Wire Protocol](https://www.postgresql.org/docs/current/protocol.html)
- [Tokio Async Runtime](https://tokio.rs/)
- [PgBouncer Transaction Pooling](https://www.pgbouncer.org/features.html)
- [PGlite Issue #324: Concurrent databases](https://github.com/electric-sql/pglite/issues/324)
