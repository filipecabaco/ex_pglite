import Config

# Configure logger - set to :warning to reduce noise, :debug for verbose output
config :logger, level: :warning

# Pool size can be increased for concurrent workloads
# The Tokio-based multiplexer handles concurrent connections efficiently
config :ecto_integration, EctoIntegration.Repo, migration_lock: false, pool_size: 5
