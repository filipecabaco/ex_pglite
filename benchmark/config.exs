defmodule Benchmark.Config do
  @moduledoc """
  Configuration for benchmark runs.
  """

  defstruct [
    :instances,
    :duration_seconds,
    :persistence_mode,
    :schema_type,
    :data_rows,
    :intensity,
    :sample_interval_ms,
    :output_file,
    :operations,
    :cooldown_seconds,
    :startup_timeout_seconds,
    :pool_size
  ]

  @intensity_profiles %{
    low: %{
      ops_per_second: 10,
      read_write_ratio: 0.9,
      transaction_probability: 0.1,
      batch_size: 1
    },
    medium: %{
      ops_per_second: 100,
      read_write_ratio: 0.7,
      transaction_probability: 0.3,
      batch_size: 5
    },
    high: %{
      ops_per_second: 500,
      read_write_ratio: 0.5,
      transaction_probability: 0.5,
      batch_size: 10
    },
    extreme: %{
      ops_per_second: 2000,
      read_write_ratio: 0.33,
      transaction_probability: 0.33,
      batch_size: 50
    },
    max: %{
      ops_per_second: 10000,
      read_write_ratio: 0.33,
      transaction_probability: 0.33,
      batch_size: 100
    },
    reads_only: %{
      ops_per_second: 10000,
      read_write_ratio: 1.0,
      transaction_probability: 0.0,
      batch_size: 100
    },
    writes_only: %{
      ops_per_second: 10000,
      read_write_ratio: 0.0,
      transaction_probability: 0.0,
      batch_size: 100
    },
    transactions_only: %{
      ops_per_second: 10000,
      read_write_ratio: 0.0,
      transaction_probability: 1.0,
      batch_size: 100
    }
  }

  @schema_types [:simple, :complex, :realistic]

  def new(opts \\ []) do
    instances = Keyword.get(opts, :instances, 1)
    default_startup_timeout = 60 + (instances * 30)

    %__MODULE__{
      instances: instances,
      duration_seconds: Keyword.get(opts, :duration_seconds, 60),
      persistence_mode: Keyword.get(opts, :persistence_mode, :memory),
      schema_type: Keyword.get(opts, :schema_type, :simple),
      data_rows: Keyword.get(opts, :data_rows, 1000),
      intensity: Keyword.get(opts, :intensity, :medium),
      sample_interval_ms: Keyword.get(opts, :sample_interval_ms, 1000),
      output_file: Keyword.get(opts, :output_file, nil),
      operations: Keyword.get(opts, :operations, [:read, :write, :transaction]),
      cooldown_seconds: Keyword.get(opts, :cooldown_seconds, 0),
      startup_timeout_seconds: Keyword.get(opts, :startup_timeout_seconds, default_startup_timeout),
      pool_size: Keyword.get(opts, :pool_size, 10)
    }
  end

  def intensity_profile(config) do
    Map.get(@intensity_profiles, config.intensity, @intensity_profiles.medium)
  end

  def valid_intensity?(intensity), do: Map.has_key?(@intensity_profiles, intensity)
  def valid_schema_type?(type), do: type in @schema_types

  def parse_cli_args(args) do
    {opts, _, _} =
      OptionParser.parse(args,
        strict: [
          instances: :integer,
          duration: :integer,
          persistence: :string,
          schema: :string,
          rows: :integer,
          intensity: :string,
          sample_interval: :integer,
          output: :string,
          cooldown: :integer,
          startup_timeout: :integer,
          pool_size: :integer
        ],
        aliases: [
          i: :instances,
          d: :duration,
          p: :persistence,
          s: :schema,
          r: :rows,
          n: :intensity,
          o: :output,
          c: :cooldown,
          t: :startup_timeout,
          P: :pool_size
        ]
      )

    instances = Keyword.get(opts, :instances, 1)
    default_startup_timeout = 60 + (instances * 30)

    new(
      instances: instances,
      duration_seconds: Keyword.get(opts, :duration, 60),
      persistence_mode: parse_persistence(Keyword.get(opts, :persistence, "memory")),
      schema_type: parse_schema(Keyword.get(opts, :schema, "simple")),
      data_rows: Keyword.get(opts, :rows, 1000),
      intensity: parse_intensity(Keyword.get(opts, :intensity, "medium")),
      sample_interval_ms: Keyword.get(opts, :sample_interval, 1000),
      output_file: Keyword.get(opts, :output),
      cooldown_seconds: Keyword.get(opts, :cooldown, 0),
      startup_timeout_seconds: Keyword.get(opts, :startup_timeout, default_startup_timeout),
      pool_size: Keyword.get(opts, :pool_size, 10)
    )
  end

  defp parse_persistence("memory"), do: :memory
  defp parse_persistence("file"), do: :file
  defp parse_persistence(_), do: :memory

  defp parse_schema("simple"), do: :simple
  defp parse_schema("complex"), do: :complex
  defp parse_schema("realistic"), do: :realistic
  defp parse_schema(_), do: :simple

  defp parse_intensity("low"), do: :low
  defp parse_intensity("medium"), do: :medium
  defp parse_intensity("high"), do: :high
  defp parse_intensity("extreme"), do: :extreme
  defp parse_intensity("max"), do: :max
  defp parse_intensity("reads_only"), do: :reads_only
  defp parse_intensity("writes_only"), do: :writes_only
  defp parse_intensity("transactions_only"), do: :transactions_only
  defp parse_intensity(_), do: :medium
end
