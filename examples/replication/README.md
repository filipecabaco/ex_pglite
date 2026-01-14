# PGLite Replication Example

Real-time database replication from PostgreSQL to local PGLite cache.

> **Quick Demo**: Run `elixir quickstart.exs` followed by `mix demo` to see real-time replication in action!

This example demonstrates:
1. Starting PostgreSQL with sample data (users, posts, comments)
2. Creating a local PGLite cache with real-time replication
3. Syncing tables from the public schema to in-memory PGLite
4. **Live monitoring** that displays changes as they are replicated

## Quick Start

### Option 1: Automated Setup (Recommended)

Run the quickstart script to set everything up automatically:

```bash
elixir quickstart.exs
```

Then run the demo with live monitoring:

```bash
mix demo
```

The demo will actively monitor the PGLite cache and **automatically display any changes** as they happen in real-time!

### Option 2: Manual Setup

#### 1. Start PostgreSQL with sample data

```bash
docker-compose up -d
```

This starts PostgreSQL with:
- 5 sample users
- 5 sample posts
- Logical replication enabled
- All required permissions configured

#### 2. Install dependencies

```bash
mix deps.get
```

#### 3. Run the live monitoring demo

```bash
mix demo
```

The demo will:
- Connect to PostgreSQL and start replication
- Display current data in the PGLite cache
- **Actively monitor and display changes in real-time** (every 500ms)
- Show detailed information about each replicated operation

## Seeing Replication in Action

The demo runs in **live monitoring mode**. When you make changes to the PostgreSQL database, they will be **automatically detected and displayed**.

### Open another terminal and connect to PostgreSQL:

```bash
psql postgres://postgres:postgres@localhost:5432/postgres
```

### Try these operations and watch them appear instantly in the demo:

**Insert a new user:**
```sql
INSERT INTO public.users (name, email, age)
VALUES ('Jane Doe', 'jane@example.com', 30);
```

**Add a comment:**
```sql
INSERT INTO public.comments (post_id, user_id, content)
VALUES (1, 2, 'This is replicated in real-time!');
```

**Update a post:**
```sql
UPDATE public.posts
SET title = 'Real-time Replication Works!'
WHERE id = 1;
```

**Delete a comment:**
```sql
DELETE FROM public.comments WHERE id = 1;
```

The demo will automatically detect and display:
- ✨ Which operation occurred (INSERT/UPDATE/DELETE)
- 📊 The table affected and row count change
- 📝 The actual data that was inserted or modified
- ⏰ Timestamp of the replication event

No need to manually refresh or query - changes appear automatically!

## Advanced Usage

If you prefer to use IEx directly:

```bash
iex -S mix
```

```elixir
source_conn_opts = [
  host: "localhost",
  port: 5432,
  database: "postgres",
  username: "postgres",
  password: "postgres"
]

config = %{source: source_conn_opts}
{:ok, client} = ReadReplica.start_link(config)

# Get the PGLite connection
pid = ReadReplica.get_cache_connection(client)

# Query the local cache
Postgrex.query!(pid, "SELECT * FROM public.users", [])
Postgrex.query!(pid, "SELECT * FROM public.posts", [])
Postgrex.query!(pid, "SELECT * FROM public.comments", [])
```

## How It Works

1. **Schema Synchronization**: On startup, the system uses `pg_dump` to export the schema and initial data from PostgreSQL
2. **Logical Replication**: Creates a replication slot and subscribes to changes using the `pgoutput` plugin
3. **Real-time Updates**: All INSERT, UPDATE, DELETE, and TRUNCATE operations are streamed to PGLite in real-time
4. **Local Queries**: Query the PGLite cache with zero network latency for reads

## Cleanup

Stop and remove the PostgreSQL container:

```bash
docker-compose down -v
```
