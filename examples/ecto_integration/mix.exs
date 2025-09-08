defmodule EctoIntegration.MixProject do
  use Mix.Project

  def project do
    [
      app: :ecto_integration,
      version: "0.1.0",
      elixir: "~> 1.18",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger],
      mod: {EctoIntegration.Application, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:ex_pglite, path: "../../"},
      {:ecto_sql, "~> 3.10"},
      {:postgrex, "~> 0.21"}
    ]
  end
end
