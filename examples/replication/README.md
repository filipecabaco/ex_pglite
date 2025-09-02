# PGLite Replication

Real-time database replication from PostgreSQL to local PGLite cache.

Note: The database in Docker has a startup script to add sample data for the example.

## Quick Start

Start the PostgreSQL database and Elixir session:

```bash
# Start PostgreSQL
docker-compose up -d

# Start interactive Elixir session
iex -S mix
```

In the IEx session:

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

pid = ReadReplica.get_cache_connection(client)
Postgrex.query!(pid, "SELECT * from public.comments", [])
```

Test replication by connecting to PostgreSQL:

```bash
psql postgres://postgres:postgres@localhost:5432/postgres
```

Run sample operations:

```sql
INSERT INTO public.comments (id, post_id, user_id, content, created_at) VALUES
  (1, 1, 3, 'Sample comment', '2025-08-31 21:30:59.410121');
UPDATE public.comments SET content = 'Updated comment' WHERE id = 1;
DELETE FROM public.comments WHERE id = 1;
```

This example demonstrates:
1. Starting PostgreSQL with default credentials
2. Creating a local PGLite cache with real-time replication  
3. Syncing tables from the public schema to in-memory PGLite
4. Maintaining real-time updates via replication handlers
