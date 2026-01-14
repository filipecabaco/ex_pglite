defmodule SingleInstanceMultipleDbs.MixProject do
  use Mix.Project

  def project do
    [
      app: :single_instance_multiple_dbs,
      version: "0.1.0",
      elixir: "~> 1.14",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger]
    ]
  end

  defp deps do
    [
      {:ex_pglite, path: "../.."},
      {:postgrex, "~> 0.19"}
    ]
  end
end













