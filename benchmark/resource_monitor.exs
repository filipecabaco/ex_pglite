defmodule Benchmark.ResourceMonitor do
  @moduledoc """
  Monitors CPU and memory usage for PgLite processes using system commands.
  Works on macOS and Linux.

  Uses ETS for lock-free reads of current usage and samples.
  """

  use GenServer

  defstruct [:pids, :sample_interval_ms, :timer_ref, :start_time, :ets_table]

  @ets_table :benchmark_resource_monitor

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: Keyword.get(opts, :name, __MODULE__))
  end

  def add_pid(server \\ __MODULE__, pid) when is_integer(pid) do
    GenServer.call(server, {:add_pid, pid})
  end

  def remove_pid(server \\ __MODULE__, pid) when is_integer(pid) do
    GenServer.call(server, {:remove_pid, pid})
  end

  def get_samples(_server \\ __MODULE__) do
    read_samples_from_ets()
  end

  def get_current_usage(_server \\ __MODULE__) do
    read_current_usage_from_ets()
  end

  def get_summary(_server \\ __MODULE__) do
    samples = read_samples_from_ets()
    compute_summary(samples)
  end

  def stop(server \\ __MODULE__) do
    GenServer.stop(server)
  end

  def read_samples_from_ets do
    case :ets.lookup(@ets_table, :samples) do
      [{:samples, samples}] -> Enum.reverse(samples)
      [] -> []
    end
  catch
    :error, :badarg -> []
  end

  def read_current_usage_from_ets do
    case :ets.lookup(@ets_table, :current_usage) do
      [{:current_usage, usage}] -> usage
      [] -> default_usage()
    end
  catch
    :error, :badarg -> default_usage()
  end

  defp default_usage do
    %{
      timestamp_ms: 0,
      per_process: %{},
      total: %{cpu_percent: 0.0, memory_mb: 0.0, process_count: 0},
      system: %{total_memory_mb: 0, free_memory_mb: 0, used_memory_mb: 0, load_average: [0, 0, 0]}
    }
  end

  @impl true
  def init(opts) do
    interval = Keyword.get(opts, :sample_interval_ms, 1000)

    ets_table =
      :ets.new(@ets_table, [:named_table, :public, :set, {:read_concurrency, true}])

    :ets.insert(ets_table, {:samples, []})
    :ets.insert(ets_table, {:current_usage, default_usage()})
    :ets.insert(ets_table, {:pids, MapSet.new()})

    timer_ref = :timer.send_interval(interval, :sample)

    {:ok,
     %__MODULE__{
       pids: MapSet.new(),
       sample_interval_ms: interval,
       timer_ref: timer_ref,
       start_time: System.monotonic_time(:millisecond),
       ets_table: ets_table
     }}
  end

  @impl true
  def handle_call({:add_pid, pid}, _from, state) do
    new_pids = MapSet.put(state.pids, pid)
    :ets.insert(state.ets_table, {:pids, new_pids})
    {:reply, :ok, %{state | pids: new_pids}}
  end

  @impl true
  def handle_call({:remove_pid, pid}, _from, state) do
    new_pids = MapSet.delete(state.pids, pid)
    :ets.insert(state.ets_table, {:pids, new_pids})
    {:reply, :ok, %{state | pids: new_pids}}
  end

  @impl true
  def handle_info(:sample, state) do
    sample = collect_usage(state.pids, state.start_time)

    [{:samples, samples}] = :ets.lookup(state.ets_table, :samples)
    :ets.insert(state.ets_table, {:samples, [sample | samples]})
    :ets.insert(state.ets_table, {:current_usage, sample})

    {:noreply, state}
  end

  @impl true
  def terminate(_reason, state) do
    if state.timer_ref, do: :timer.cancel(state.timer_ref)

    try do
      :ets.delete(state.ets_table)
    catch
      :error, :badarg -> :ok
    end

    :ok
  end

  defp collect_usage(pids, start_time) do
    elapsed_ms = System.monotonic_time(:millisecond) - start_time
    pid_list = MapSet.to_list(pids)

    per_process =
      pid_list
      |> Enum.map(fn pid -> {pid, get_process_stats(pid)} end)
      |> Enum.filter(fn {_, stats} -> stats != nil end)
      |> Map.new()

    total_cpu = per_process |> Map.values() |> Enum.map(& &1.cpu_percent) |> Enum.sum()
    total_memory_mb = per_process |> Map.values() |> Enum.map(& &1.memory_mb) |> Enum.sum()

    system_stats = get_system_stats()

    %{
      timestamp_ms: elapsed_ms,
      per_process: per_process,
      total: %{
        cpu_percent: total_cpu,
        memory_mb: total_memory_mb,
        process_count: map_size(per_process)
      },
      system: system_stats
    }
  end

  defp get_process_stats(pid) do
    case :os.type() do
      {:unix, :darwin} -> get_darwin_process_stats(pid)
      {:unix, _} -> get_linux_process_stats(pid)
      _ -> nil
    end
  end

  defp get_darwin_process_stats(pid) do
    case System.cmd("ps", ["-p", "#{pid}", "-o", "%cpu,%mem,rss,vsz", "-w"], stderr_to_stdout: true) do
      {output, 0} ->
        lines = String.split(output, "\n", trim: true)

        case lines do
          [_header, data | _] ->
            parts = String.split(data, ~r/\s+/, trim: true)

            case parts do
              [cpu, _mem, rss, vsz | _] ->
                %{
                  cpu_percent: parse_float(cpu),
                  memory_mb: parse_int(rss) / 1024,
                  virtual_memory_mb: parse_int(vsz) / 1024
                }

              _ ->
                nil
            end

          _ ->
            nil
        end

      _ ->
        nil
    end
  end

  defp get_linux_process_stats(pid) do
    case System.cmd("ps", ["-p", "#{pid}", "-o", "%cpu,%mem,rss,vsz", "--no-headers"],
           stderr_to_stdout: true
         ) do
      {output, 0} ->
        parts = String.split(String.trim(output), ~r/\s+/, trim: true)

        case parts do
          [cpu, _mem, rss, vsz | _] ->
            %{
              cpu_percent: parse_float(cpu),
              memory_mb: parse_int(rss) / 1024,
              virtual_memory_mb: parse_int(vsz) / 1024
            }

          _ ->
            nil
        end

      _ ->
        nil
    end
  end

  defp get_system_stats do
    case :os.type() do
      {:unix, :darwin} -> get_darwin_system_stats()
      {:unix, _} -> get_linux_system_stats()
      _ -> %{total_memory_mb: 0, free_memory_mb: 0, load_average: [0, 0, 0]}
    end
  end

  defp get_darwin_system_stats do
    memory = get_darwin_memory()
    load_avg = get_load_average()

    %{
      total_memory_mb: memory.total,
      free_memory_mb: memory.free,
      used_memory_mb: memory.used,
      load_average: load_avg
    }
  end

  defp get_linux_system_stats do
    memory = get_linux_memory()
    load_avg = get_load_average()

    %{
      total_memory_mb: memory.total,
      free_memory_mb: memory.free,
      used_memory_mb: memory.used,
      load_average: load_avg
    }
  end

  defp get_darwin_memory do
    case System.cmd("vm_stat", [], stderr_to_stdout: true) do
      {output, 0} ->
        lines = String.split(output, "\n")
        page_size = get_darwin_page_size()

        stats =
          lines
          |> Enum.filter(&String.contains?(&1, ":"))
          |> Enum.map(fn line ->
            [key, value] = String.split(line, ":", parts: 2)
            {String.trim(key), parse_int(String.trim(value))}
          end)
          |> Map.new()

        pages_free = Map.get(stats, "Pages free", 0)
        pages_active = Map.get(stats, "Pages active", 0)
        pages_inactive = Map.get(stats, "Pages inactive", 0)
        pages_wired = Map.get(stats, "Pages wired down", 0)
        pages_speculative = Map.get(stats, "Pages speculative", 0)

        total_pages = pages_free + pages_active + pages_inactive + pages_wired + pages_speculative
        total_mb = total_pages * page_size / (1024 * 1024)
        free_mb = (pages_free + pages_inactive) * page_size / (1024 * 1024)
        used_mb = (pages_active + pages_wired) * page_size / (1024 * 1024)

        %{total: total_mb, free: free_mb, used: used_mb}

      _ ->
        %{total: 0, free: 0, used: 0}
    end
  end

  defp get_darwin_page_size do
    case System.cmd("pagesize", [], stderr_to_stdout: true) do
      {output, 0} -> parse_int(String.trim(output))
      _ -> 4096
    end
  end

  defp get_linux_memory do
    case File.read("/proc/meminfo") do
      {:ok, content} ->
        lines = String.split(content, "\n")

        stats =
          lines
          |> Enum.filter(&String.contains?(&1, ":"))
          |> Enum.map(fn line ->
            [key, value] = String.split(line, ":", parts: 2)
            kb = value |> String.trim() |> String.replace(" kB", "") |> parse_int()
            {String.trim(key), kb}
          end)
          |> Map.new()

        total = Map.get(stats, "MemTotal", 0) / 1024
        free = Map.get(stats, "MemFree", 0) / 1024
        available = Map.get(stats, "MemAvailable", free) / 1024

        %{total: total, free: available, used: total - available}

      _ ->
        %{total: 0, free: 0, used: 0}
    end
  end

  defp get_load_average do
    case System.cmd("uptime", [], stderr_to_stdout: true) do
      {output, 0} ->
        case Regex.run(~r/load average[s]?:\s*([\d.]+),?\s*([\d.]+),?\s*([\d.]+)/, output) do
          [_, l1, l5, l15] -> [parse_float(l1), parse_float(l5), parse_float(l15)]
          _ -> [0.0, 0.0, 0.0]
        end

      _ ->
        [0.0, 0.0, 0.0]
    end
  end

  defp parse_float(str) do
    case Float.parse(String.trim(str)) do
      {f, _} -> f
      :error -> 0.0
    end
  end

  defp parse_int(str) when is_binary(str) do
    str = String.replace(str, ".", "")

    case Integer.parse(String.trim(str)) do
      {i, _} -> i
      :error -> 0
    end
  end

  defp parse_int(_), do: 0

  defp compute_summary(samples) when length(samples) == 0 do
    %{
      sample_count: 0,
      duration_seconds: 0,
      cpu: %{min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0},
      memory_mb: %{min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0},
      peak_process_count: 0
    }
  end

  defp compute_summary(samples) do
    cpu_values = Enum.map(samples, & &1.total.cpu_percent)
    memory_values = Enum.map(samples, & &1.total.memory_mb)
    process_counts = Enum.map(samples, & &1.total.process_count)

    first_ts = List.last(samples).timestamp_ms
    last_ts = List.first(samples).timestamp_ms
    duration_seconds = (last_ts - first_ts) / 1000

    %{
      sample_count: length(samples),
      duration_seconds: duration_seconds,
      cpu: compute_stats(cpu_values),
      memory_mb: compute_stats(memory_values),
      peak_process_count: Enum.max(process_counts)
    }
  end

  defp compute_stats(values) when length(values) == 0 do
    %{min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0}
  end

  defp compute_stats(values) do
    sorted = Enum.sort(values)
    count = length(sorted)

    %{
      min: Enum.min(sorted),
      max: Enum.max(sorted),
      avg: Enum.sum(sorted) / count,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99)
    }
  end

  defp percentile(sorted_list, p) do
    count = length(sorted_list)
    index = round((p / 100) * (count - 1))
    Enum.at(sorted_list, index)
  end
end
