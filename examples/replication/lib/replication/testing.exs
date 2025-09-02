source_conn_opts = [host: "localhost", port: 5432, database: "postgres", username: "postgres", password: "postgres"]
config = %{source: source_conn_opts}
{:ok, client} = ReadReplica.start_link(config)

pid = ReadReplica.get_cache_connection(client)
Postgrex.query!(pid, "SELECT * from public.comments", [])


# DATA TO ADD DURING SESSION
# INSERT INTO public.comments (id, post_id, user_id, content, created_at) VALUES
#   (1, 1, 3, 'a', '2025-08-31 21:30:59.410121'),
#   (2, 1, 3, 'b', '2025-08-31 21:30:59.410121'),
#   (3, 1, 3, 'c', '2025-08-31 21:30:59.410121'),
#   (4, 1, 3, 'd', '2025-08-31 21:30:59.410121');

# UPDATE public.comments SET content = 'b' WHERE post_id = 1;

# DELETE FROM public.comments WHERE post_id = 1;

# TRUNCATE TABLE public.comments;
