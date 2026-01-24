defmodule Pglite.MixProject do
  use Mix.Project

  def project do
    [
      app: :ex_pglite,
      version: "0.1.0",
      elixir: "~> 1.14",
      start_permanent: Mix.env() == :prod,
      elixirc_paths: elixirc_paths(Mix.env()),
      deps: deps(),
      package: package(),
      description: "Elixir library for PGLite - lightweight PostgreSQL with Postgrex integration",
      aliases: aliases()
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp aliases do
    [
      test: ["pglite.build_fresh", "test"]
    ]
  end

  defp package do
    [
      name: "ex_pglite",
      files: [
        "lib",
        "pglited/src",
        "pglited/assets",
        "pglited/Cargo.toml",
        "pglited/Makefile",
        "pglited/build.rs",
        "mix.exs",
        "Makefile",
        "README.md",
        "LICENSE"
      ],
      maintainers: ["filipecabaco"],
      licenses: ["MIT"],
      links: %{
        "GitHub" => "https://github.com/filipecabaco/ex_pglite",
        "Docs" => "https://hexdocs.pm/ex_pglite"
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
