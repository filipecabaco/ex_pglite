defmodule Replication.MixProject do
  use Mix.Project

  def project do
    [
      app: :read_replica,
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
      mod: {ReadReplica.Application, []}
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:postgrex, "~> 0.19"},
      {:jason, "~> 1.4"},
      {:postgres_replication, git: "https://github.com/filipecabaco/postgres_replication.git"},
      {:ex_pglite, path: "../../"}
    ]
  end
end
