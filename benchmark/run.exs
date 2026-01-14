#!/usr/bin/env elixir

# ExPglite Benchmark Runner
#
# Usage:
#   mix run benchmark/run.exs [options]
#
# Options:
#   -i, --instances <n>      Number of PgLite instances (default: 1)
#   -d, --duration <seconds> Benchmark duration in seconds (default: 60)
#   -p, --persistence <mode> Persistence mode: memory|file (default: memory)
#   -s, --schema <type>      Schema type: simple|complex|realistic (default: simple)
#   -r, --rows <n>           Number of data rows to seed (default: 1000)
#   -n, --intensity <level>  Workload intensity: low|medium|high (default: medium)
#   --sample-interval <ms>   Resource sampling interval in ms (default: 1000)
#   -o, --output <file>      Output file for JSON results
#
# Examples:
#   # Quick test with defaults
#   mix run benchmark/run.exs
#
#   # 5 instances, high intensity, 30 minutes
#   mix run benchmark/run.exs -i 5 -d 1800 -n high
#
#   # Realistic schema with file persistence
#   mix run benchmark/run.exs -s realistic -p file -r 10000 -d 300
#
#   # Save results to file
#   mix run benchmark/run.exs -d 60 -o results.json

# Load all benchmark modules
Code.require_file("config.exs", __DIR__)
Code.require_file("resource_monitor.exs", __DIR__)
Code.require_file("schema_generator.exs", __DIR__)
Code.require_file("data_generator.exs", __DIR__)
Code.require_file("workload_runner.exs", __DIR__)
Code.require_file("orchestrator.exs", __DIR__)

defmodule Benchmark.CLI do
  def main(args) do
    config = Benchmark.Config.parse_cli_args(args)

    case Benchmark.Orchestrator.run(config) do
      {:ok, _results} ->
        IO.puts("\nBenchmark completed successfully!")
        System.halt(0)

      {:error, reason} ->
        IO.puts("\nBenchmark failed: #{inspect(reason)}")
        System.halt(1)
    end
  end

  def print_help do
    IO.puts("""
    ExPglite Benchmark Tool

    Usage:
      mix run benchmark/run.exs [options]

    Options:
      -i, --instances <n>        Number of PgLite instances (default: 1)
      -d, --duration <seconds>   Benchmark duration in seconds (default: 60)
      -p, --persistence <mode>   Persistence mode: memory|file (default: memory)
      -s, --schema <type>        Schema type: simple|complex|realistic (default: simple)
      -r, --rows <n>             Number of data rows to seed (default: 1000)
      -n, --intensity <level>    Workload intensity: low|medium|high (default: medium)
      --sample-interval <ms>     Resource sampling interval in ms (default: 1000)
      -o, --output <file>        Output file for JSON results
      -h, --help                 Show this help

    Intensity Profiles:
      low:     10 ops/sec,  90% reads, 10% transactions
      medium:  100 ops/sec, 70% reads, 30% transactions
      high:    500 ops/sec, 50% reads, 50% transactions

    Schema Types:
      simple:    Single table with indexes (benchmark_items)
      complex:   E-commerce schema (users, products, orders, etc.)
      realistic: Multi-tenant SaaS schema with JSONB, UUIDs, audit logs

    Examples:
      # Quick 1-minute test
      mix run benchmark/run.exs

      # 5 instances, high intensity, 30 minutes
      mix run benchmark/run.exs -i 5 -d 1800 -n high

      # Realistic schema with file persistence
      mix run benchmark/run.exs -s realistic -p file -r 10000 -d 300

      # Save results to JSON
      mix run benchmark/run.exs -d 60 -o benchmark_results.json
    """)
  end
end

# Parse args and check for help
args = System.argv()

if "--help" in args or "-h" in args do
  Benchmark.CLI.print_help()
  System.halt(0)
else
  Benchmark.CLI.main(args)
end
