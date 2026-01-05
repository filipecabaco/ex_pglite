defmodule Benchmark.Orchestrator do
  @moduledoc """
  Orchestrates benchmark runs by:
  1. Starting PgLite instances
  2. Setting up schemas and seeding data
  3. Starting workload runners
  4. Monitoring resources
  5. Collecting and reporting results
  """

  require Logger

  defstruct [
    :config,
    :pglite_instances,
    :connections,
    :workload_runners,
    :resource_monitor,
    :start_time,
    :results
  ]

  def run(config) do
    IO.puts("\n" <> header("ExPglite Benchmark"))
    IO.puts("Configuration:")
    print_config(config)

    state = %__MODULE__{
      config: config,
      pglite_instances: [],
      connections: [],
      workload_runners: [],
      results: %{}
    }

    Process.put(:benchmark_state, state)
    setup_signal_handler()

    with {:ok, state} <- start_resource_monitor(state),
         _ <- Process.put(:benchmark_state, state),
         {:ok, state} <- start_pglite_instances(state),
         _ <- Process.put(:benchmark_state, state),
         {:ok, state} <- setup_databases(state),
         _ <- Process.put(:benchmark_state, state),
         {:ok, state} <- start_workloads(state),
         _ <- Process.put(:benchmark_state, state),
         {:ok, state} <- run_benchmark(state),
         {:ok, state} <- run_cooldown(state),
         {:ok, results} <- collect_results(state) do
      cleanup(state)
      print_results(results, config)
      maybe_save_results(results, config)
      {:ok, results}
    else
      {:error, reason} ->
        state = Process.get(:benchmark_state, state)
        cleanup(state)
        {:error, reason}
    end
  end

  defp setup_signal_handler do
    Process.flag(:trap_exit, true)

    parent = self()

    spawn(fn ->
      Process.flag(:trap_exit, true)
      ref = Process.monitor(parent)

      receive do
        {:DOWN, ^ref, :process, ^parent, _reason} ->
          :ok

        {:EXIT, _, :shutdown} ->
          send(parent, :sigint_received)

        {:EXIT, _, :normal} ->
          :ok
      end
    end)

    try do
      :os.set_signal(:sigint, :handle)
      :os.set_signal(:sigterm, :handle)
    catch
      _, _ -> :ok
    end
  end

  defp header(text) do
    line = String.duplicate("=", 60)
    "#{line}\n#{String.pad_leading(text, 35)}\n#{line}"
  end

  defp print_config(config) do
    IO.puts("  Instances:       #{config.instances}")
    IO.puts("  Duration:        #{config.duration_seconds}s")
    IO.puts("  Persistence:     #{config.persistence_mode}")
    IO.puts("  Schema:          #{config.schema_type}")
    IO.puts("  Data rows:       #{config.data_rows}")
    IO.puts("  Intensity:       #{config.intensity}")
    IO.puts("  Sample interval: #{config.sample_interval_ms}ms")
    IO.puts("  Cooldown:        #{config.cooldown_seconds}s")
    IO.puts("  Startup timeout: #{config.startup_timeout_seconds}s")
    IO.puts("")
  end

  defp start_resource_monitor(state) do
    IO.puts("Starting resource monitor...")

    case Benchmark.ResourceMonitor.start_link(
           sample_interval_ms: state.config.sample_interval_ms,
           name: Benchmark.ResourceMonitor
         ) do
      {:ok, pid} ->
        {:ok, %{state | resource_monitor: pid}}

      {:error, reason} ->
        {:error, {:resource_monitor_failed, reason}}
    end
  end

  defp start_pglite_instances(state) do
    IO.puts("Starting #{state.config.instances} PgLite instance(s) in parallel...")
    IO.puts("  (Each instance automatically gets its own isolated WASM copy)")
    IO.puts("  (Startup timeout: #{state.config.startup_timeout_seconds}s)")

    instance_configs =
      1..state.config.instances
      |> Enum.map(fn i ->
        port = 54320 + i

        opts =
          case state.config.persistence_mode do
            :memory ->
              [memory: true, tcp_port: port]

            :file ->
              data_dir = Path.join(System.tmp_dir!(), "pglite_bench_#{i}_#{System.unique_integer([:positive])}")
              File.mkdir_p!(data_dir)
              [memory: false, data_dir: data_dir, tcp_port: port]
          end

        {i, port, opts}
      end)

    startup_timeout_ms = state.config.startup_timeout_seconds * 1000

    results =
      instance_configs
      |> Task.async_stream(
        fn {i, port, opts} ->
          case Pglite.start_link(opts) do
            {:ok, pid} ->
              Process.unlink(pid)
              os_pid = get_os_pid_from_pglite(pid)
              {:ok, {i, port, pid, opts, os_pid}}

            error ->
              {:error, {i, port, error}}
          end
        end,
        max_concurrency: state.config.instances,
        timeout: startup_timeout_ms,
        ordered: true
      )
      |> Enum.map(fn
        {:ok, {:ok, {i, port, pid, opts, os_pid}}} ->
          if os_pid, do: Benchmark.ResourceMonitor.add_pid(os_pid)
          IO.puts("  Instance #{i} started on port #{port} (PID: #{os_pid || "unknown"})")
          {:ok, {i, port, pid, opts, os_pid}}

        {:ok, {:error, {i, port, error}}} ->
          IO.puts("  Instance #{i} FAILED on port #{port}: #{inspect(error)}")
          {:error, {i, port, error}}

        {:exit, reason} ->
          IO.puts("  Instance FAILED with exit: #{inspect(reason)}")
          {:error, {:exit, reason}}
      end)

    {successes, failures} =
      Enum.reduce(results, {[], []}, fn
        {:ok, {_i, _port, pid, opts, _os_pid}}, {succ, fail} ->
          {[{pid, opts} | succ], fail}

        {:error, info}, {succ, fail} ->
          {succ, [info | fail]}
      end)

    if length(failures) > 0 do
      {:error, {:pglite_start_failed, failures}}
    else
      instances = Enum.reverse(successes)
      IO.puts("  All #{length(instances)} instances started successfully")

      Process.sleep(500)

      {:ok, %{state | pglite_instances: instances}}
    end
  end

  defp get_os_pid_from_pglite(pglite_pid) do
    try do
      pglite_state = :sys.get_state(pglite_pid)
      port = pglite_state.port

      case Port.info(port, :os_pid) do
        {:os_pid, pid} -> pid
        _ -> nil
      end
    rescue
      _ -> nil
    end
  end

  defp setup_databases(state) do
    IO.puts("\nSetting up databases in parallel...")

    indexed_instances =
      state.pglite_instances
      |> Enum.with_index(1)

    max_concurrency = min(
      state.config.instances,
      max(2, System.schedulers_online())
    )

    results =
      indexed_instances
      |> Task.async_stream(
        fn {{pglite_pid, _opts}, i} ->
          start_time = System.monotonic_time(:millisecond)

          conn_opts = Pglite.get_connection_opts(pglite_pid)
          {:ok, conn} = Postgrex.start_link(conn_opts)
          Process.unlink(conn)

          ddl_start = System.monotonic_time(:millisecond)

          schema = Benchmark.SchemaGenerator.generate_schema(state.config.schema_type)

          schema
          |> String.split(";")
          |> Enum.map(&String.trim/1)
          |> Enum.reject(&(&1 == ""))
          |> Enum.each(fn stmt ->
            Postgrex.query!(conn, stmt, [])
          end)

          ddl_time = System.monotonic_time(:millisecond) - ddl_start

          seed_start = System.monotonic_time(:millisecond)
          rows = Benchmark.DataGenerator.seed_data(conn, state.config.schema_type, state.config.data_rows)
          seed_time = System.monotonic_time(:millisecond) - seed_start

          elapsed = System.monotonic_time(:millisecond) - start_time
          {i, conn, rows, elapsed, ddl_time, seed_time}
        end,
        max_concurrency: max_concurrency,
        timeout: 120_000
      )
      |> Enum.to_list()

    {successes, failures} =
      Enum.reduce(results, {[], []}, fn
        {:ok, {i, conn, rows, elapsed, ddl_time, seed_time}}, {succ, fail} ->
          IO.puts("  Instance #{i}: schema created, #{rows} rows seeded (total: #{elapsed}ms, DDL: #{ddl_time}ms, seed: #{seed_time}ms)")
          {[{i, conn} | succ], fail}

        {:exit, reason}, {succ, fail} ->
          IO.puts("  Database setup failed: #{inspect(reason)}")
          {succ, [reason | fail]}
      end)

    if length(failures) > 0 do
      {:error, {:database_setup_failed, failures}}
    else
      connections =
        successes
        |> Enum.sort_by(fn {i, _} -> i end)
        |> Enum.map(fn {_, conn} -> conn end)

      IO.puts("  All #{length(connections)} databases setup complete")
      {:ok, %{state | connections: connections}}
    end
  end

  defp start_workloads(state) do
    IO.puts("\nStarting workload runners...")
    intensity_profile = Benchmark.Config.intensity_profile(state.config)
    IO.puts("  Ops/second target: #{intensity_profile.ops_per_second}")
    IO.puts("  Read/write ratio: #{intensity_profile.read_write_ratio}")
    IO.puts("  Transaction probability: #{intensity_profile.transaction_probability}")

    runners =
      state.connections
      |> Enum.with_index(1)
      |> Enum.map(fn {conn, i} ->
        {:ok, runner} =
          Benchmark.WorkloadRunner.start_link(
            conn: conn,
            schema_type: state.config.schema_type,
            intensity_profile: intensity_profile,
            operations: state.config.operations
          )

        IO.puts("  Workload runner #{i} started")
        runner
      end)

    stats_tables =
      Enum.map(runners, fn runner ->
        Benchmark.WorkloadRunner.get_stats_table(runner)
      end)

    {:ok, %{state | workload_runners: runners, start_time: System.monotonic_time(:second), results: %{stats_tables: stats_tables}}}
  end

  defp run_benchmark(state) do
    IO.puts("\n" <> header("Running Benchmark"))
    IO.puts("Duration: #{state.config.duration_seconds} seconds")
    IO.puts("(Press Ctrl+C to stop early and cleanup)")
    IO.puts("")

    progress_interval = max(1, div(state.config.duration_seconds, 20))

    run_benchmark_loop(state, 1, progress_interval)
  end

  defp run_benchmark_loop(state, elapsed, _progress_interval) when elapsed > state.config.duration_seconds do
    {:ok, state}
  end

  defp run_benchmark_loop(state, elapsed, progress_interval) do
    receive do
      :sigint_received ->
        IO.puts("\n\nReceived interrupt signal, stopping benchmark...")
        {:ok, state}

      {:signal, :sigint} ->
        IO.puts("\n\nReceived SIGINT, stopping benchmark...")
        {:ok, state}

      {:signal, :sigterm} ->
        IO.puts("\n\nReceived SIGTERM, stopping benchmark...")
        {:ok, state}
    after
      1000 ->
        if rem(elapsed, progress_interval) == 0 or elapsed == state.config.duration_seconds do
          progress = round(elapsed / state.config.duration_seconds * 100)
          usage = Benchmark.ResourceMonitor.get_current_usage()

          stats_tables = state.results[:stats_tables] || []
          total_ops =
            stats_tables
            |> Enum.map(fn table ->
              stats = Benchmark.WorkloadRunner.read_stats_from_ets(table)
              stats.total_operations
            end)
            |> Enum.sum()

          ops_per_sec = if elapsed > 0, do: div(total_ops, elapsed), else: 0

          IO.puts(
            "[#{String.pad_leading("#{progress}%", 4)}] #{elapsed}s elapsed | " <>
              "Ops: #{total_ops} (#{ops_per_sec}/s) | " <>
              "CPU: #{fmt(usage.total.cpu_percent, 1)}% | " <>
              "Mem: #{fmt(usage.total.memory_mb, 1)}MB"
          )
        end

        run_benchmark_loop(state, elapsed + 1, progress_interval)
    end
  end

  defp run_cooldown(state) when state.config.cooldown_seconds <= 0 do
    {:ok, state}
  end

  defp run_cooldown(state) do
    IO.puts("\n" <> header("Cooldown Phase"))
    IO.puts("Monitoring memory deflation for #{state.config.cooldown_seconds} seconds...")
    IO.puts("(Workloads stopped, instances still running)")
    IO.puts("")

    Enum.each(state.workload_runners, fn runner ->
      try do
        GenServer.stop(runner, :normal, 500)
      catch
        _, _ -> :ok
      end
    end)

    initial_usage = Benchmark.ResourceMonitor.get_current_usage()
    initial_memory = initial_usage.total.memory_mb

    IO.puts("Initial memory: #{fmt(initial_memory, 2)} MB")
    IO.puts("")

    progress_interval = max(1, div(state.config.cooldown_seconds, 10))
    run_cooldown_loop(state, 1, progress_interval, initial_memory)
  end

  defp run_cooldown_loop(state, elapsed, _progress_interval, initial_memory)
       when elapsed > state.config.cooldown_seconds do
    final_usage = Benchmark.ResourceMonitor.get_current_usage()
    final_memory = final_usage.total.memory_mb
    diff = final_memory - initial_memory
    diff_percent = if initial_memory > 0, do: (diff / initial_memory) * 100, else: 0

    IO.puts("")
    IO.puts("Cooldown complete:")
    IO.puts("  Initial memory: #{fmt(initial_memory, 2)} MB")
    IO.puts("  Final memory:   #{fmt(final_memory, 2)} MB")
    IO.puts("  Difference:     #{fmt(diff, 2)} MB (#{fmt(diff_percent, 1)}%)")

    {:ok, %{state | workload_runners: []}}
  end

  defp run_cooldown_loop(state, elapsed, progress_interval, initial_memory) do
    receive do
      :sigint_received ->
        IO.puts("\n\nReceived interrupt signal, stopping cooldown...")
        {:ok, %{state | workload_runners: []}}

      {:signal, :sigint} ->
        IO.puts("\n\nReceived SIGINT, stopping cooldown...")
        {:ok, %{state | workload_runners: []}}

      {:signal, :sigterm} ->
        IO.puts("\n\nReceived SIGTERM, stopping cooldown...")
        {:ok, %{state | workload_runners: []}}
    after
      1000 ->
        if rem(elapsed, progress_interval) == 0 or elapsed == state.config.cooldown_seconds do
          usage = Benchmark.ResourceMonitor.get_current_usage()
          current_memory = usage.total.memory_mb
          diff = current_memory - initial_memory

          IO.puts(
            "[#{elapsed}s] Memory: #{fmt(current_memory, 2)} MB | " <>
              "Change: #{fmt(diff, 2)} MB | " <>
              "CPU: #{fmt(usage.total.cpu_percent, 1)}%"
          )
        end

        run_cooldown_loop(state, elapsed + 1, progress_interval, initial_memory)
    end
  end

  defp collect_results(state) do
    IO.puts("\nCollecting results...")

    stats_tables = state.results[:stats_tables] || []

    workload_stats =
      stats_tables
      |> Enum.with_index(1)
      |> Enum.map(fn {table, i} ->
        stats = Benchmark.WorkloadRunner.read_stats_from_ets(table)
        {:"instance_#{i}", stats}
      end)
      |> Map.new()

    aggregate_workload = aggregate_workload_stats(Map.values(workload_stats))
    resource_summary = Benchmark.ResourceMonitor.get_summary()
    resource_samples = Benchmark.ResourceMonitor.get_samples()

    results = %{
      config: summarize_config(state.config),
      resource_usage: resource_summary,
      resource_samples: resource_samples,
      workload: %{
        per_instance: workload_stats,
        aggregate: aggregate_workload
      },
      throughput: %{
        ops_per_second: aggregate_workload.total_operations / state.config.duration_seconds,
        reads_per_second: aggregate_workload.reads / state.config.duration_seconds,
        writes_per_second: aggregate_workload.writes / state.config.duration_seconds,
        transactions_per_second: aggregate_workload.transactions / state.config.duration_seconds
      }
    }

    {:ok, results}
  end

  defp summarize_config(config) do
    %{
      instances: config.instances,
      duration_seconds: config.duration_seconds,
      persistence_mode: config.persistence_mode,
      schema_type: config.schema_type,
      data_rows: config.data_rows,
      intensity: config.intensity
    }
  end

  defp aggregate_workload_stats(stats_list) do
    %{
      total_operations: Enum.sum(Enum.map(stats_list, & &1.total_operations)),
      reads: Enum.sum(Enum.map(stats_list, & &1.reads)),
      writes: Enum.sum(Enum.map(stats_list, & &1.writes)),
      transactions: Enum.sum(Enum.map(stats_list, & &1.transactions)),
      errors: Enum.sum(Enum.map(stats_list, & &1.errors)),
      error_rate: safe_avg(Enum.map(stats_list, & &1.error_rate)),
      latency: %{
        avg_us: safe_avg(Enum.map(stats_list, & &1.latency.avg_us)),
        min_us: safe_min(Enum.map(stats_list, & &1.latency.min_us)),
        max_us: safe_max(Enum.map(stats_list, & &1.latency.max_us)),
        p50_us: safe_avg(Enum.map(stats_list, & &1.latency.p50_us)),
        p95_us: safe_avg(Enum.map(stats_list, & &1.latency.p95_us)),
        p99_us: safe_avg(Enum.map(stats_list, & &1.latency.p99_us))
      }
    }
  end

  defp safe_avg([]), do: 0
  defp safe_avg(list), do: Enum.sum(list) / length(list)

  defp safe_min([]), do: 0
  defp safe_min(list), do: Enum.min(list)

  defp safe_max([]), do: 0
  defp safe_max(list), do: Enum.max(list)

  defp cleanup(state) do
    IO.puts("\nCleaning up...")

    Logger.configure(level: :warning)

    state.workload_runners
    |> Task.async_stream(
      fn runner ->
        try do
          GenServer.stop(runner, :normal, 500)
        catch
          _, _ -> :ok
        end
      end,
      timeout: 1000,
      on_timeout: :kill_task
    )
    |> Stream.run()

    state.connections
    |> Task.async_stream(
      fn conn ->
        try do
          GenServer.stop(conn, :normal, 500)
        catch
          _, _ -> :ok
        end
      end,
      timeout: 1000,
      on_timeout: :kill_task
    )
    |> Stream.run()

    Process.sleep(100)

    state.pglite_instances
    |> Task.async_stream(
      fn {pid, opts} ->
        try do
          GenServer.stop(pid, :normal, 1000)
        catch
          _, _ -> :ok
        end

        if opts[:data_dir] && !opts[:memory] do
          File.rm_rf(opts[:data_dir])
        end
      end,
      timeout: 2000,
      on_timeout: :kill_task
    )
    |> Stream.run()

    if state.resource_monitor do
      try do
        GenServer.stop(state.resource_monitor, :normal, 500)
      catch
        _, _ -> :ok
      end
    end

    Logger.configure(level: :debug)

    IO.puts("Cleanup complete")
  end

  defp print_results(results, _config) do
    IO.puts("\n" <> header("Benchmark Results"))

    IO.puts("\n== Resource Usage ==")
    r = results.resource_usage
    IO.puts("  Samples collected: #{r.sample_count}")
    IO.puts("  Duration: #{fmt(r.duration_seconds, 1)}s")
    IO.puts("")
    IO.puts("  CPU Usage:")
    IO.puts("    Min:  #{fmt(r.cpu.min, 2)}%")
    IO.puts("    Max:  #{fmt(r.cpu.max, 2)}%")
    IO.puts("    Avg:  #{fmt(r.cpu.avg, 2)}%")
    IO.puts("    P50:  #{fmt(r.cpu.p50, 2)}%")
    IO.puts("    P95:  #{fmt(r.cpu.p95, 2)}%")
    IO.puts("    P99:  #{fmt(r.cpu.p99, 2)}%")
    IO.puts("")
    IO.puts("  Memory Usage:")
    IO.puts("    Min:  #{fmt(r.memory_mb.min, 2)} MB")
    IO.puts("    Max:  #{fmt(r.memory_mb.max, 2)} MB")
    IO.puts("    Avg:  #{fmt(r.memory_mb.avg, 2)} MB")
    IO.puts("    P50:  #{fmt(r.memory_mb.p50, 2)} MB")
    IO.puts("    P95:  #{fmt(r.memory_mb.p95, 2)} MB")
    IO.puts("    P99:  #{fmt(r.memory_mb.p99, 2)} MB")

    IO.puts("\n== Throughput ==")
    t = results.throughput
    IO.puts("  Total ops/sec:       #{fmt(t.ops_per_second, 2)}")
    IO.puts("  Reads/sec:           #{fmt(t.reads_per_second, 2)}")
    IO.puts("  Writes/sec:          #{fmt(t.writes_per_second, 2)}")
    IO.puts("  Transactions/sec:    #{fmt(t.transactions_per_second, 2)}")

    IO.puts("\n== Workload Stats ==")
    w = results.workload.aggregate
    IO.puts("  Total operations:    #{w.total_operations}")
    IO.puts("  Reads:               #{w.reads}")
    IO.puts("  Writes:              #{w.writes}")
    IO.puts("  Transactions:        #{w.transactions}")
    IO.puts("  Errors:              #{w.errors}")
    IO.puts("  Error rate:          #{fmt(w.error_rate * 100, 2)}%")

    IO.puts("\n== Latency ==")
    l = w.latency
    IO.puts("  Min:  #{fmt(l.min_us / 1000, 2)} ms")
    IO.puts("  Max:  #{fmt(l.max_us / 1000, 2)} ms")
    IO.puts("  Avg:  #{fmt(l.avg_us / 1000, 2)} ms")
    IO.puts("  P50:  #{fmt(l.p50_us / 1000, 2)} ms")
    IO.puts("  P95:  #{fmt(l.p95_us / 1000, 2)} ms")
    IO.puts("  P99:  #{fmt(l.p99_us / 1000, 2)} ms")

    IO.puts("\n" <> String.duplicate("=", 60))
  end

  defp maybe_save_results(results, config) do
    if config.output_file do
      IO.puts("\nSaving results to #{config.output_file}...")

      json =
        results
        |> sanitize_for_json()
        |> Jason.encode!(pretty: true)

      File.write!(config.output_file, json)
      IO.puts("Results saved successfully")
    end
  end

  defp sanitize_for_json(data) when is_map(data) do
    data
    |> Map.from_struct()
    |> Enum.map(fn {k, v} -> {to_string(k), sanitize_for_json(v)} end)
    |> Map.new()
  rescue
    _ ->
      data
      |> Enum.map(fn {k, v} -> {to_string(k), sanitize_for_json(v)} end)
      |> Map.new()
  end

  defp sanitize_for_json(data) when is_list(data) do
    Enum.map(data, &sanitize_for_json/1)
  end

  defp sanitize_for_json(data) when is_atom(data), do: to_string(data)
  defp sanitize_for_json(data) when is_float(data), do: Float.round(data, 4)
  defp sanitize_for_json(data), do: data

  defp fmt(value, precision) when is_integer(value), do: fmt(value / 1, precision)
  defp fmt(value, precision) when is_float(value), do: Float.round(value, precision)
  defp fmt(value, _precision), do: value
end
