defmodule Mix.Tasks.Pglite.Benchmark do
  @moduledoc """
  Runs ExPglite performance benchmarks.

  ## Usage

      mix pglite.benchmark [options]

  ## Options

    * `-i`, `--instances` - Number of PgLite instances (default: 1)
    * `-d`, `--duration` - Benchmark duration in seconds (default: 60)
    * `-p`, `--persistence` - Persistence mode: memory|file (default: memory)
    * `-s`, `--schema` - Schema type: simple|complex|realistic (default: simple)
    * `-r`, `--rows` - Number of data rows to seed (default: 1000)
    * `-n`, `--intensity` - Workload intensity: low|medium|high (default: medium)
    * `--sample-interval` - Resource sampling interval in ms (default: 1000)
    * `-o`, `--output` - Output file for JSON results
    * `-c`, `--cooldown` - Cooldown period in seconds after benchmark to monitor memory deflation (default: 0)
    * `-t`, `--startup-timeout` - Timeout in seconds for starting instances (default: 60 + instances * 30)

  ## Intensity Profiles

    * `low` - 10 ops/sec, 90% reads, 10% transactions
    * `medium` - 100 ops/sec, 70% reads, 30% transactions
    * `high` - 500 ops/sec, 50% reads, 50% transactions

  ## Schema Types

    * `simple` - Single table with indexes (benchmark_items)
    * `complex` - E-commerce schema (users, products, orders, etc.)
    * `realistic` - Multi-tenant SaaS schema with JSONB, UUIDs, audit logs

  ## Examples

      # Quick 1-minute test
      mix pglite.benchmark

      # 5 instances, high intensity, 30 minutes
      mix pglite.benchmark -i 5 -d 1800 -n high

      # Realistic schema with file persistence
      mix pglite.benchmark -s realistic -p file -r 10000 -d 300

      # Save results to JSON
      mix pglite.benchmark -d 60 -o benchmark_results.json
  """

  use Mix.Task

  require Logger

  @shortdoc "Run ExPglite performance benchmarks"

  @impl true
  def run(args) do
    # Set log level to warning by default for cleaner output (before app starts)
    Logger.configure(level: :warning)

    # Ensure the application is started
    Mix.Task.run("app.start")

    # Re-apply log level after app start to ensure it takes effect
    Logger.configure(level: :warning)

    # Load benchmark modules
    benchmark_dir = Path.join(File.cwd!(), "benchmark")

    Code.require_file("config.exs", benchmark_dir)
    Code.require_file("resource_monitor.exs", benchmark_dir)
    Code.require_file("schema_generator.exs", benchmark_dir)
    Code.require_file("data_generator.exs", benchmark_dir)
    Code.require_file("workload_runner.exs", benchmark_dir)
    Code.require_file("orchestrator.exs", benchmark_dir)

    if "--help" in args or "-h" in args do
      Mix.shell().info(@moduledoc)
    else
      # Use apply to avoid compile-time warnings for runtime-loaded modules
      config = apply(Benchmark.Config, :parse_cli_args, [args])

      case apply(Benchmark.Orchestrator, :run, [config]) do
        {:ok, _results} ->
          Mix.shell().info("\nBenchmark completed successfully!")

        {:error, reason} ->
          Mix.raise("Benchmark failed: #{inspect(reason)}")
      end
    end
  end
end
