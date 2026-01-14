defmodule Mix.Tasks.Demo do
  @moduledoc """
  Runs an interactive demonstration of PGLite replication from PostgreSQL.

  This task starts the replication system and actively monitors for changes,
  displaying them in real-time as they are replicated to PGLite.

  ## Usage

      mix demo

  The task will:
  1. Start the PGLite replication system
  2. Connect to the local PostgreSQL database
  3. Monitor and display changes as they happen in real-time
  """

  use Mix.Task
  require Logger

  @shortdoc "Runs a demonstration of PGLite replication with live monitoring"

  defmodule Monitor do
    use GenServer

    def start_link(cache_pid) do
      GenServer.start_link(__MODULE__, cache_pid, name: __MODULE__)
    end

    def init(cache_pid) do
      state = %{
        cache_pid: cache_pid,
        last_counts: get_counts(cache_pid)
      }
      schedule_check()
      {:ok, state}
    end

    def handle_info(:check, state) do
      new_counts = get_counts(state.cache_pid)

      if new_counts != state.last_counts do
        display_change(state.last_counts, new_counts, state.cache_pid)
      end

      schedule_check()
      {:noreply, %{state | last_counts: new_counts}}
    end

    defp schedule_check do
      Process.send_after(self(), :check, 500)
    end

    defp get_counts(cache_pid) do
      %{
        users: count_rows(cache_pid, "users"),
        posts: count_rows(cache_pid, "posts"),
        comments: count_rows(cache_pid, "comments")
      }
    end

    defp count_rows(cache_pid, table) do
      result = Postgrex.query!(cache_pid, "SELECT COUNT(*) FROM public.#{table}", [])
      result.rows |> List.first() |> List.first()
    end

    defp display_change(old_counts, new_counts, cache_pid) do
      timestamp = DateTime.utc_now() |> DateTime.to_string()
      IO.puts("\n" <> IO.ANSI.green() <> "🔄 REPLICATION EVENT DETECTED! " <> IO.ANSI.reset() <> "[#{timestamp}]")
      IO.puts(String.duplicate("─", 70))

      Enum.each([:users, :posts, :comments], fn table ->
        old_count = Map.get(old_counts, table)
        new_count = Map.get(new_counts, table)

        if old_count != new_count do
          diff = new_count - old_count
          operation = if diff > 0, do: "INSERT", else: "DELETE"
          color = if diff > 0, do: IO.ANSI.cyan(), else: IO.ANSI.magenta()

          IO.puts(color <> "  #{operation}: #{abs(diff)} row(s) in #{table} table (#{old_count} → #{new_count})" <> IO.ANSI.reset())

          # Show the actual new/changed data
          if diff > 0 do
            show_latest_rows(cache_pid, table, abs(diff))
          end
        end
      end)

      IO.puts(String.duplicate("─", 70))
    end

    defp show_latest_rows(cache_pid, :users, count) do
      result = Postgrex.query!(cache_pid, "SELECT id, name, email FROM public.users ORDER BY id DESC LIMIT $1", [count])
      Enum.each(result.rows, fn [id, name, email] ->
        IO.puts("    → User ##{id}: #{name} (#{email})")
      end)
    end

    defp show_latest_rows(cache_pid, :posts, count) do
      result = Postgrex.query!(cache_pid, "SELECT id, title, published FROM public.posts ORDER BY id DESC LIMIT $1", [count])
      Enum.each(result.rows, fn [id, title, published] ->
        status = if published, do: "Published", else: "Draft"
        IO.puts("    → Post ##{id}: #{title} [#{status}]")
      end)
    end

    defp show_latest_rows(cache_pid, :comments, count) do
      result = Postgrex.query!(cache_pid, "SELECT id, post_id, user_id, content FROM public.comments ORDER BY id DESC LIMIT $1", [count])
      Enum.each(result.rows, fn [id, post_id, user_id, content] ->
        IO.puts("    → Comment ##{id} on Post ##{post_id} by User ##{user_id}: \"#{String.slice(content, 0..50)}...\"")
      end)
    end
  end

  @impl Mix.Task
  def run(_args) do
    Mix.Task.run("app.start")

    # Setup cleanup handler for graceful shutdown
    System.at_exit(fn exit_code ->
      if exit_code == 0 do
        cleanup_demo()
      end
    end)

    IO.puts("\n" <> IO.ANSI.cyan() <> "╔════════════════════════════════════════════════╗" <> IO.ANSI.reset())
    IO.puts(IO.ANSI.cyan() <> "║   PGLite Real-Time Replication Demo           ║" <> IO.ANSI.reset())
    IO.puts(IO.ANSI.cyan() <> "╚════════════════════════════════════════════════╝" <> IO.ANSI.reset())
    IO.puts("\nStarting replication from PostgreSQL to PGLite...\n")

    source_conn_opts = [
      host: "localhost",
      port: 5432,
      database: "postgres",
      username: "postgres",
      password: "postgres"
    ]

    config = %{source: source_conn_opts}

    case ReadReplica.start_link(config) do
      {:ok, client} ->
        IO.puts(IO.ANSI.green() <> "✓ Replication started successfully!" <> IO.ANSI.reset())
        cache_pid = ReadReplica.get_cache_connection(client)

        # Give replication time to settle
        Process.sleep(1000)

        show_initial_data(cache_pid)

        # Start the monitor
        {:ok, _monitor} = Monitor.start_link(cache_pid)

        show_instructions()
        monitor_loop(client)

      {:error, reason} ->
        IO.puts(IO.ANSI.red() <> "✗ Failed to start replication: #{inspect(reason)}" <> IO.ANSI.reset())
        IO.puts("\nMake sure PostgreSQL is running:")
        IO.puts("  docker-compose up -d")
        System.halt(1)
    end
  end

  defp cleanup_demo do
    IO.puts("\n" <> IO.ANSI.yellow() <> "Cleaning up..." <> IO.ANSI.reset())

    # Stop ReadReplica if it's running
    if pid = Process.whereis(ReadReplica) do
      GenServer.stop(pid, :normal, 5000)
    end

    # Stop Monitor if it's running
    if pid = Process.whereis(__MODULE__.Monitor) do
      GenServer.stop(pid, :normal, 1000)
    end

    # Give processes time to cleanup
    Process.sleep(500)
    IO.puts(IO.ANSI.green() <> "✓ Demo stopped cleanly" <> IO.ANSI.reset())
  end

  defp show_initial_data(cache_pid) do
    IO.puts("\n" <> IO.ANSI.yellow() <> "📊 Current data in PGLite cache:" <> IO.ANSI.reset())

    tables = ["users", "posts", "comments"]

    Enum.each(tables, fn table ->
      result = Postgrex.query!(cache_pid, "SELECT COUNT(*) FROM public.#{table}", [])
      count = result.rows |> List.first() |> List.first()
      IO.puts("  #{table}: #{count} rows")
    end)

    IO.puts("\n" <> IO.ANSI.yellow() <> "👥 Sample users:" <> IO.ANSI.reset())
    result = Postgrex.query!(cache_pid, "SELECT id, name, email FROM public.users LIMIT 3", [])
    Enum.each(result.rows, fn [id, name, email] ->
      IO.puts("  [#{id}] #{name} (#{email})")
    end)

    IO.puts("\n" <> IO.ANSI.yellow() <> "📝 Sample posts:" <> IO.ANSI.reset())
    result = Postgrex.query!(cache_pid, "SELECT id, title, published FROM public.posts LIMIT 3", [])
    Enum.each(result.rows, fn [id, title, published] ->
      status = if published, do: "✓", else: "✗"
      IO.puts("  [#{id}] #{title} #{status}")
    end)
  end

  defp show_instructions do
    IO.puts("\n" <> String.duplicate("═", 70))
    IO.puts(IO.ANSI.cyan() <> "🎯 Live Monitoring Active!" <> IO.ANSI.reset())
    IO.puts(String.duplicate("═", 70))
    IO.puts("\nThe demo is now watching for changes. Any INSERT, UPDATE, or DELETE")
    IO.puts("operations in PostgreSQL will be instantly detected and displayed here!")
    IO.puts("\n" <> IO.ANSI.yellow() <> "To test replication, open another terminal and run:" <> IO.ANSI.reset())
    IO.puts("  " <> IO.ANSI.cyan() <> "psql postgres://postgres:postgres@localhost:5432/postgres" <> IO.ANSI.reset())
    IO.puts("\n" <> IO.ANSI.yellow() <> "Then try these operations:" <> IO.ANSI.reset())
    IO.puts("\n  " <> IO.ANSI.green() <> "-- Insert a new comment" <> IO.ANSI.reset())
    IO.puts("  " <> IO.ANSI.white() <> "INSERT INTO public.comments (post_id, user_id, content)" <> IO.ANSI.reset())
    IO.puts("  " <> IO.ANSI.white() <> "VALUES (1, 2, 'This is replicated in real-time!');" <> IO.ANSI.reset())
    IO.puts("\n  " <> IO.ANSI.green() <> "-- Add a new user" <> IO.ANSI.reset())
    IO.puts("  " <> IO.ANSI.white() <> "INSERT INTO public.users (name, email, age)" <> IO.ANSI.reset())
    IO.puts("  " <> IO.ANSI.white() <> "VALUES ('Jane Doe', 'jane@example.com', 30);" <> IO.ANSI.reset())
    IO.puts("\n  " <> IO.ANSI.green() <> "-- Update a post" <> IO.ANSI.reset())
    IO.puts("  " <> IO.ANSI.white() <> "UPDATE public.posts SET title = 'Real-time Replication Works!' WHERE id = 1;" <> IO.ANSI.reset())
    IO.puts("\n  " <> IO.ANSI.green() <> "-- Delete a comment (if exists)" <> IO.ANSI.reset())
    IO.puts("  " <> IO.ANSI.white() <> "DELETE FROM public.comments WHERE id = 1;" <> IO.ANSI.reset())
    IO.puts("\n" <> String.duplicate("═", 70))
    IO.puts("\n" <> IO.ANSI.magenta() <> "Watching for changes..." <> IO.ANSI.reset() <> " (monitoring every 500ms)")
    IO.puts(IO.ANSI.yellow() <> "Press Ctrl+C to stop the demo" <> IO.ANSI.reset())
  end

  defp monitor_loop(_cache_pid) do
    # Just sleep forever - users can Ctrl+C to exit
    Process.sleep(:infinity)
  end
end
