import Config

# Configure logger
config :logger, level: :debug
config :ecto_integration, EctoIntegration.Repo, migration_lock: false, pool_size: 1
