defmodule Pglite.MixProject do
  use Mix.Project

  def project do
    [
      app: :ex_pglite,
      version: "0.1.0",
      elixir: "~> 1.18",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      package: package(),
      description: "Elixir library for PGLite - lightweight PostgreSQL with Postgrex integration",
      aliases: aliases()
    ]
  end

  defp aliases do
    [
      "build.assets": &build_assets/1
    ]
  end

  defp build_assets(_args) do
    # Load and run the build module
    Code.require_file("scripts/build_assets.ex")
    Pglite.BuildAssets.build_and_move()
  end

  defp package do
    [
      name: "ex_pglite",
      files: [
        "lib",
        "priv/pglite/index.js",
        "priv/pglite/pglite.wasm",
        "priv/pglite/pglite.data",
        "mix.exs",
        "README.md",
        "LICENSE"
      ],
      maintainers: ["filipecabaco"],
      licenses: ["MIT"],
      links: %{
        "GitHub" => "https://github.com/filipecabaco/pglite",
        "Docs" => "https://hexdocs.pm/pglite"
      }
    ]
  end

  # Run "mix help compile.app" to learn about applications.
  def application do
    [
      extra_applications: [:logger]
    ]
  end

  # Run "mix help deps" to learn about dependencies.
  defp deps do
    [
      {:jason, "~> 1.4"},
      {:postgrex, "~> 0.21"},
      {:ex_doc, "~> 0.30", only: :dev, runtime: false},
      {:sobelow, "~> 0.13", only: [:dev, :test], runtime: false},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
      {:mix_audit, "~> 2.1", only: [:dev, :test], runtime: false}
    ]
  end
end
