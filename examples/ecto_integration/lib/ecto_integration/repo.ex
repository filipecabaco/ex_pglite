defmodule EctoIntegration.Repo do
  @moduledoc """
  The repository for EctoIntegration application.

  This repo will be configured at runtime with PGLite connection options.
  """

  use Ecto.Repo,
    otp_app: :ecto_integration,
    adapter: Ecto.Adapters.Postgres
end
