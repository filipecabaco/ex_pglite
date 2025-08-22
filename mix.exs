defmodule Pglite.MixProject do
  use Mix.Project

  def project do
    [
      app: :pglite,
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
      name: "pglite",
      files: [
        "lib",
        "priv",
        "mix.exs",
        "README.md",
        "LICENSE",
        "SHIPPING.md",
        # Include any versioned optimized files
        "index.js",
        "pglite.wasm",
        "pglite.data"
      ],
      maintainers: ["Your Name"],
      licenses: ["MIT"],
      links: %{
        "GitHub" => "https://github.com/your-org/pglite",
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
      {:postgrex, "~> 0.21"}
    ]
  end
end
