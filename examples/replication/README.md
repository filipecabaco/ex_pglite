# PGLite Replication

Real-time database replication from PostgreSQL to local PGLite cache.

> Note: the databse in docker has a startup script to add some data for the purpose of the example.

## 🚀 Quick Start

**Two steps to get started:**

```bash
# Start PostgreSQL with default settings
docker-compose up -d

# Start interactive Elixir session
iex -S mix
```

Then copy-paste this code in the IEx session:

```elixir
source_conn_opts = [host: "localhost", port: 5432, database: "postgres", username: "postgres", password: "postgres"]
config = %{source: source_conn_opts}
{:ok, client} = ReadReplica.start_link(config)

pid = ReadReplica.get_cache_connection(client)
Postgrex.query!(pid, "SELECT * from public.comments", [])
```

You can connect to docker using `psql postgres://postgres:postgres@localhost:5432/postgres` and then run queries on the database:
```sql
 INSERT INTO public.comments (id, post_id, user_id, content, created_at) VALUES
   (1, 1, 3, 'a', '2025-08-31 21:30:59.410121'),
   (2, 1, 3, 'b', '2025-08-31 21:30:59.410121'),
   (3, 1, 3, 'c', '2025-08-31 21:30:59.410121'),
   (4, 1, 3, 'd', '2025-08-31 21:30:59.410121');
 UPDATE public.comments SET content = 'b' WHERE post_id = 1;
 DELETE FROM public.comments WHERE post_id = 1;
 TRUNCATE TABLE public.comments;
```

That's it! This will:
1. ✅ Start PostgreSQL database with default postgres/postgres credentials
2. ✅ Create local PGLite cache with real-time replication
3. ✅ Sync and dump all the tables from the public schema into the in-memory PGLite cache
4. ✅ Will be kept up to date using Replication.Handler
