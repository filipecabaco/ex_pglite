defmodule Pglite.MixProject do
  use Mix.Project

  def project do
    [
      app: :pglite,
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
      mod: {Pglite.Application, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:jason, "~> 1.4"},
      {:postgres_replication, git: "https://github.com/filipecabaco/postgres_replication.git"}
    ]
  end
end
