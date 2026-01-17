# PGLite Connection Pool Research: Handling Single-Connection Limitation

## Problem Statement

PGLite (PostgreSQL compiled to WebAssembly) has a fundamental limitation: **it only supports a single connection at a time**. This is due to:

1. The WASM store mutex (`Arc<Mutex<Store<WasiP1Ctx>>>`) that serializes all queries
2. A single 64KB shared buffer for query/response data
3. No multi-process architecture in the WASM runtime

This limitation prevents running complex scenarios that require:
- Multiple concurrent database connections (e.g., Ecto with pool_size > 1)
- Parallel query execution
- Testing concurrent transaction behavior
- Connection pooling with multiple workers

## Current Architecture Analysis

### How Connections Work Today

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Applications                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Postgrex │  │ Postgrex │  │ Postgrex │  (Multiple clients)   │
│  │  Conn 1  │  │  Conn 2  │  │  Conn 3  │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
└───────┼─────────────┼─────────────┼────────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│              TCP Listener (127.0.0.1:54321)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Spawns thread per connection                    │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │  │
│  │  │Thread 1 │  │Thread 2 │  │Thread 3 │                   │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘                   │  │
│  └───────┼───────────┼───────────┼──────────────────────────┘  │
│          │           │           │                              │
│          ▼           ▼           ▼                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              BOTTLENECK: store.lock().unwrap()            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │            Arc<Mutex<Store<WasiP1Ctx>>>            │  │  │
│  │  │                                                     │  │  │
│  │  │  Only ONE query can execute at a time!             │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Bottleneck Code (lib.rs:499-520)

```rust
pub fn process_wire_message(&self, data: &[u8]) -> Result<Vec<u8>> {
    let mut store = self.store.lock().unwrap();  // <-- SERIALIZATION POINT

    self.write_to_buffer_locked(&mut store, data)?;
    self.interactive_write_locked(&mut store, data.len())?;
    // ... query execution ...
}
```

---

## Proposed Solutions

### Solution 1: Reverse Connection Pool (Query Queue Serializer)

**Concept**: Accept multiple PostgreSQL connections but serialize all queries through a single internal queue, presenting the illusion of concurrent connections while internally processing them sequentially.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Applications                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Postgrex │  │ Postgrex │  │ Postgrex │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
└───────┼─────────────┼─────────────┼────────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Connection Multiplexer (New Component)             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Virtual Connection Pool                   │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐                   │  │
│  │  │VConn 1  │  │VConn 2  │  │VConn 3  │                   │  │
│  │  │(session)│  │(session)│  │(session)│                   │  │
│  │  └────┬────┘  └────┬────┘  └────┬────┘                   │  │
│  │       │           │           │                           │  │
│  │       ▼           ▼           ▼                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              Query Queue (FIFO + Priority)          │  │  │
│  │  │  [Query1, Query2, Query3, ...]                     │  │  │
│  │  └────────────────────┬───────────────────────────────┘  │  │
│  └───────────────────────┼──────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Single Backend Connection                    │  │
│  │                   to PGLite WASM                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation Options

##### Option 1A: Rust-Level Multiplexer (in pglite_port)

Modify the Rust code to implement multiplexing at the TCP level:

```rust
// New: Query queue with per-connection state tracking
struct QueryRequest {
    connection_id: u64,
    wire_message: Vec<u8>,
    response_channel: oneshot::Sender<Vec<u8>>,
}

struct ConnectionMultiplexer {
    runtime: Arc<PgliteRuntime>,
    query_queue: mpsc::Receiver<QueryRequest>,
    connection_states: HashMap<u64, ConnectionState>,
}

struct ConnectionState {
    transaction_status: TransactionStatus,  // Idle, InTransaction, Error
    session_variables: HashMap<String, String>,
    prepared_statements: HashMap<String, PreparedStatement>,
}

impl ConnectionMultiplexer {
    async fn run(&mut self) {
        while let Some(request) = self.query_queue.recv().await {
            // Apply connection-specific state if needed
            self.apply_session_state(request.connection_id);

            // Process query
            let response = self.runtime.process_wire_message(&request.wire_message);

            // Update connection state based on response
            self.update_connection_state(request.connection_id, &response);

            // Send response back to waiting connection
            let _ = request.response_channel.send(response);
        }
    }
}
```

**Pros**:
- Handles multiplexing at the optimal level (closest to PGLite)
- Can track per-connection state (transactions, session variables)
- Minimal latency overhead

**Cons**:
- Complex state management
- Requires handling transaction boundaries carefully
- Needs to emulate PostgreSQL session behavior

##### Option 1B: Elixir-Level Multiplexer (new GenServer)

Create an Elixir GenServer that acts as a connection proxy:

```elixir
defmodule Pglite.ConnectionPool do
  use GenServer

  defstruct [:pglite, :internal_conn, :queue, :current_request]

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts)
  end

  # Client API - appears like a normal Postgrex connection
  def query(pool, query, params, opts \\ []) do
    GenServer.call(pool, {:query, query, params, opts}, :infinity)
  end

  # Checkout a virtual connection
  def checkout(pool) do
    GenServer.call(pool, :checkout)
  end

  @impl true
  def init(opts) do
    {:ok, pglite} = Pglite.start_link(opts)
    {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))

    {:ok, %__MODULE__{
      pglite: pglite,
      internal_conn: conn,
      queue: :queue.new(),
      current_request: nil
    }}
  end

  @impl true
  def handle_call({:query, query, params, opts}, from, state) do
    request = {from, query, params, opts}
    new_state = enqueue_and_process(%{state | queue: :queue.in(request, state.queue)})
    {:noreply, new_state}
  end

  defp enqueue_and_process(%{current_request: nil} = state) do
    case :queue.out(state.queue) do
      {{:value, {from, query, params, opts}}, rest} ->
        # Execute query on the single internal connection
        result = Postgrex.query(state.internal_conn, query, params, opts)
        GenServer.reply(from, result)
        enqueue_and_process(%{state | queue: rest, current_request: nil})

      {:empty, _} ->
        state
    end
  end

  defp enqueue_and_process(state), do: state
end
```

**Pros**:
- Simpler implementation in Elixir
- Easy to integrate with existing supervision trees
- Can leverage Elixir's excellent concurrency primitives

**Cons**:
- Additional serialization overhead (Elixir → Postgrex → TCP → Rust)
- Harder to maintain per-connection session state

---

### Solution 2: Transaction-Aware Multiplexer

A more sophisticated approach that understands PostgreSQL transaction semantics:

```elixir
defmodule Pglite.TransactionAwarePool do
  @moduledoc """
  Multiplexes multiple virtual connections over a single PGLite connection,
  with awareness of transaction boundaries.

  Key insight: Only ONE transaction can be active at a time on a single connection.
  Non-transactional queries can be interleaved safely.
  """

  defstruct [
    :pglite,
    :conn,
    :active_transaction,      # {connection_id, transaction_state}
    :waiting_transactions,    # Queue of connections waiting for transaction
    :simple_query_queue       # Queue for non-transactional queries
  ]

  def handle_call({:begin_transaction, conn_id}, from, state) do
    case state.active_transaction do
      nil ->
        # No active transaction, this connection gets it
        result = execute_on_backend(state.conn, "BEGIN")
        {:reply, result, %{state | active_transaction: {conn_id, :in_transaction}}}

      {^conn_id, _} ->
        # This connection already owns the transaction (nested BEGIN - PostgreSQL ignores)
        {:reply, {:ok, :already_in_transaction}, state}

      {_other_conn_id, _} ->
        # Another connection owns the transaction, queue this one
        new_waiting = :queue.in({from, conn_id}, state.waiting_transactions)
        {:noreply, %{state | waiting_transactions: new_waiting}}
    end
  end

  def handle_call({:commit, conn_id}, _from, state) do
    case state.active_transaction do
      {^conn_id, :in_transaction} ->
        result = execute_on_backend(state.conn, "COMMIT")
        new_state = release_transaction_and_process_next(state)
        {:reply, result, new_state}

      _ ->
        {:reply, {:error, :not_in_transaction}, state}
    end
  end

  # Simple queries (no transaction) can execute immediately if no transaction is active
  # or queue behind the current transaction
  def handle_call({:simple_query, query, params}, from, state) do
    case state.active_transaction do
      nil ->
        # No transaction, execute immediately
        result = Postgrex.query(state.conn, query, params)
        {:reply, result, state}

      _ ->
        # Transaction active, queue the query
        new_queue = :queue.in({from, query, params}, state.simple_query_queue)
        {:noreply, %{state | simple_query_queue: new_queue}}
    end
  end
end
```

---

### Solution 3: Virtual Backend Sessions (Most Sophisticated)

Implement virtual PostgreSQL sessions that share a single backend, tracking all session state per virtual connection:

```rust
// Rust implementation for maximum control
struct VirtualSession {
    id: u64,

    // PostgreSQL session state to restore when this session runs
    search_path: String,
    timezone: String,
    client_encoding: String,
    application_name: String,

    // Transaction state
    transaction_status: TransactionStatus,
    savepoints: Vec<String>,

    // Prepared statements (name -> SQL)
    prepared_statements: HashMap<String, String>,

    // Cursors (name -> state)
    cursors: HashMap<String, CursorState>,
}

struct SessionManager {
    runtime: Arc<PgliteRuntime>,
    sessions: HashMap<u64, VirtualSession>,
    query_queue: VecDeque<(u64, Vec<u8>, oneshot::Sender<Vec<u8>>)>,
}

impl SessionManager {
    fn switch_to_session(&self, session_id: u64) -> Result<()> {
        let session = self.sessions.get(&session_id)?;

        // Restore session variables
        self.execute_internal(&format!(
            "SET search_path TO {}; SET timezone TO '{}'; SET client_encoding TO '{}';",
            session.search_path,
            session.timezone,
            session.client_encoding
        ))?;

        Ok(())
    }

    fn process_query(&mut self, session_id: u64, wire_message: &[u8]) -> Vec<u8> {
        // Switch session context
        self.switch_to_session(session_id);

        // Execute query
        let response = self.runtime.process_wire_message(wire_message);

        // Update session state based on response
        self.update_session_from_response(session_id, &response);

        response
    }
}
```

---

### Solution 4: Read Replica Pattern (Multiple WASM Instances)

For read-heavy workloads, maintain multiple PGLite instances with periodic synchronization:

```elixir
defmodule Pglite.ReadReplicaPool do
  @moduledoc """
  Maintains a primary instance for writes and multiple read replicas.
  Replicas are periodically synchronized using PostgreSQL dump/restore.
  """

  defstruct [:primary, :replicas, :write_log]

  def start_link(opts) do
    replica_count = Keyword.get(opts, :replicas, 3)

    # Start primary
    {:ok, primary} = Pglite.start_link(Keyword.merge(opts, [tcp_port: allocate_port()]))

    # Start replicas (initially clones of primary)
    replicas = for i <- 1..replica_count do
      {:ok, replica} = Pglite.start_link(Keyword.merge(opts, [tcp_port: allocate_port()]))
      replica
    end

    {:ok, %__MODULE__{primary: primary, replicas: replicas, write_log: []}}
  end

  def query(pool, query, params, opts \\ []) do
    if is_read_query?(query) do
      # Round-robin to replicas
      replica = select_replica(pool)
      {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(replica))
      result = Postgrex.query(conn, query, params, opts)
      GenServer.stop(conn)
      result
    else
      # Write to primary
      {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pool.primary))
      result = Postgrex.query(conn, query, params, opts)
      GenServer.stop(conn)

      # Asynchronously propagate to replicas
      propagate_to_replicas(pool, query, params)

      result
    end
  end

  defp is_read_query?(query) do
    normalized = String.downcase(String.trim(query))
    String.starts_with?(normalized, "select") or
    String.starts_with?(normalized, "with")  # CTEs that are read-only
  end
end
```

---

### Solution 5: Connection Coalescing (Batching)

Batch multiple queries from different connections into single larger operations:

```elixir
defmodule Pglite.QueryBatcher do
  @moduledoc """
  Collects queries for a short window and executes them together.
  Works well for simple queries but not for transactions.
  """

  @batch_window_ms 5
  @max_batch_size 50

  def start_link(pglite) do
    GenServer.start_link(__MODULE__, pglite)
  end

  def query(batcher, query, params) do
    GenServer.call(batcher, {:query, query, params}, :infinity)
  end

  @impl true
  def handle_call({:query, query, params}, from, state) do
    new_batch = [{from, query, params} | state.current_batch]

    if length(new_batch) >= @max_batch_size do
      execute_batch(new_batch, state.conn)
      {:noreply, %{state | current_batch: []}}
    else
      # Schedule batch execution after window
      if state.batch_timer == nil do
        timer = Process.send_after(self(), :execute_batch, @batch_window_ms)
        {:noreply, %{state | current_batch: new_batch, batch_timer: timer}}
      else
        {:noreply, %{state | current_batch: new_batch}}
      end
    end
  end

  @impl true
  def handle_info(:execute_batch, state) do
    execute_batch(state.current_batch, state.conn)
    {:noreply, %{state | current_batch: [], batch_timer: nil}}
  end

  defp execute_batch(batch, conn) do
    # For simple SELECTs, could use UNION ALL
    # For mixed queries, execute sequentially
    Enum.each(batch, fn {from, query, params} ->
      result = Postgrex.query(conn, query, params)
      GenServer.reply(from, result)
    end)
  end
end
```

---

## Comparison Matrix

| Solution | Complexity | Performance | Transaction Support | Session State | Ecto Compatible |
|----------|------------|-------------|---------------------|---------------|-----------------|
| 1A. Rust Multiplexer | High | Best | Full | Full | Yes |
| 1B. Elixir Multiplexer | Medium | Good | Basic | Limited | Partial |
| 2. Transaction-Aware | High | Good | Full | Limited | Partial |
| 3. Virtual Sessions | Very High | Good | Full | Full | Yes |
| 4. Read Replicas | Medium | Best for reads | Limited | Per-instance | Yes |
| 5. Query Batching | Low | Moderate | None | None | No |

---

## Recommended Implementation Path

### Phase 1: Basic Elixir-Level Queue (Quick Win)

Implement a simple GenServer that serializes queries:

```elixir
defmodule Pglite.Pool do
  @moduledoc """
  A simple connection pool that accepts multiple clients but serializes
  all queries through a single PGLite connection.
  """

  use GenServer

  defstruct [:pglite, :conn, :queue, :busy]

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: opts[:name])
  end

  def query(pool, query, params \\ [], opts \\ []) do
    timeout = Keyword.get(opts, :timeout, 15_000)
    GenServer.call(pool, {:query, query, params}, timeout)
  end

  def transaction(pool, fun, opts \\ []) do
    timeout = Keyword.get(opts, :timeout, 15_000)
    GenServer.call(pool, {:transaction, fun}, timeout)
  end

  @impl true
  def init(opts) do
    {:ok, pglite} = Pglite.start_link(opts)
    conn_opts = Pglite.get_connection_opts(pglite)
    {:ok, conn} = Postgrex.start_link(conn_opts)

    {:ok, %__MODULE__{
      pglite: pglite,
      conn: conn,
      queue: :queue.new(),
      busy: false
    }}
  end

  @impl true
  def handle_call({:query, query, params}, from, state) do
    handle_request({:query, query, params}, from, state)
  end

  def handle_call({:transaction, fun}, from, state) do
    handle_request({:transaction, fun}, from, state)
  end

  defp handle_request(request, from, %{busy: false} = state) do
    execute_and_reply(request, from, state)
  end

  defp handle_request(request, from, %{busy: true} = state) do
    new_queue = :queue.in({request, from}, state.queue)
    {:noreply, %{state | queue: new_queue}}
  end

  defp execute_and_reply({:query, query, params}, from, state) do
    result = Postgrex.query(state.conn, query, params)
    GenServer.reply(from, result)
    process_next(%{state | busy: false})
  end

  defp execute_and_reply({:transaction, fun}, from, state) do
    result = Postgrex.transaction(state.conn, fn conn -> fun.(conn) end)
    GenServer.reply(from, result)
    process_next(%{state | busy: false})
  end

  defp process_next(state) do
    case :queue.out(state.queue) do
      {:empty, _} ->
        {:noreply, state}

      {{:value, {request, from}}, rest} ->
        execute_and_reply(request, from, %{state | queue: rest, busy: true})
    end
  end
end
```

### Phase 2: Rust-Level Optimization

Move the queuing logic into Rust for better performance:

1. Use async Rust with tokio for efficient I/O
2. Implement connection state tracking
3. Add transaction-aware scheduling

### Phase 3: Full Virtual Session Support

Implement complete PostgreSQL session emulation for full compatibility.

---

## Alternative Approaches Worth Considering

### 1. Snapshot/Restore Pattern for Testing

For testing scenarios, pre-create database snapshots and restore them:

```elixir
defmodule Pglite.TestPool do
  def setup_test_database(pglite) do
    # Run migrations once
    run_migrations(pglite)

    # Create snapshot
    snapshot = create_snapshot(pglite)

    # For each test, restore from snapshot
    snapshot
  end

  def with_fresh_database(snapshot, fun) do
    {:ok, pglite} = Pglite.start_link_from_snapshot(snapshot)
    try do
      fun.(pglite)
    after
      GenServer.stop(pglite)
    end
  end
end
```

### 2. External Connection Pooler (PgBouncer-lite)

Build a lightweight PgBouncer-like proxy in Elixir:

```elixir
defmodule Pglite.Bouncer do
  @moduledoc """
  A lightweight PgBouncer-style proxy that implements transaction pooling
  over a single PGLite backend connection.
  """

  # Pooling modes
  @session_pooling :session
  @transaction_pooling :transaction  # Recommended
  @statement_pooling :statement

  # ...
end
```

### 3. Distributed Instance Pool

For maximum parallelism, run multiple PGLite instances and distribute queries:

```elixir
defmodule Pglite.DistributedPool do
  def start_link(opts) do
    pool_size = Keyword.get(opts, :pool_size, System.schedulers_online())

    instances = for i <- 1..pool_size do
      port = allocate_port()
      {:ok, pglite} = Pglite.start_link(tcp_port: port)
      {:ok, conn} = Postgrex.start_link(Pglite.get_connection_opts(pglite))
      {pglite, conn}
    end

    # Use a process pool to distribute queries
    # Each query goes to a random or least-busy instance
  end
end
```

---

## Conclusion

The **recommended approach** for ex_pglite is:

1. **Start with Solution 1B (Elixir-Level Multiplexer)** - Quick to implement, solves the immediate need
2. **Add Transaction-Awareness (Solution 2)** - Handle transaction boundaries properly
3. **Optimize with Rust (Solution 1A)** - If performance becomes critical

For testing use cases where isolation matters more than concurrency, consider **Solution 4 (Read Replicas)** or the **Snapshot/Restore Pattern**.

## References

- [PGlite Socket Documentation](https://pglite.dev/docs/pglite-socket)
- [PGlite Multi-Tab Worker](https://pglite.dev/docs/multi-tab-worker)
- [PgBouncer Connection Pooling](https://pgdash.io/blog/pgbouncer-connection-pool.html)
- [DBConnection Pooling Deep Dive](https://jumpwire.io/blog/dbconnection-pooling-deep-dive)
- [Elixir GenServer Documentation](https://hexdocs.pm/elixir/GenServer.html)
- [PGlite Issue #324: Support for concurrent databases](https://github.com/electric-sql/pglite/issues/324)
- [PGlite Issue #652: Browser connection limit](https://github.com/electric-sql/pglite/issues/652)
