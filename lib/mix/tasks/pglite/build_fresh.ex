defmodule Mix.Tasks.Pglite.BuildFresh do
  @moduledoc """
  Forces a fresh build of the PGlite Rust binary for testing.

  This task ensures that tests always run against the latest Rust code
  by forcing a rebuild with `cargo build --release`.
  """

  use Mix.Task

  @shortdoc "Forces a fresh build of PGlite Rust binary"

  @impl true
  def run(_args) do
    case System.find_executable("cargo") do
      nil ->
        Mix.raise("Rust/cargo not found in PATH")

      _cargo_path ->
        Mix.shell().info("Building fresh Rust port binary...")

        case System.cmd("cargo", ["build", "--release"],
               stderr_to_stdout: true,
               cd: "pglited"
             ) do
          {_output, 0} ->
            File.mkdir_p!("priv/bin")
            File.cp!("pglited/target/release/pglited", "priv/bin/pglited")

            build_priv_bin = Path.join([Mix.Project.build_path(), "lib", "ex_pglite", "priv", "bin"])
            File.mkdir_p!(build_priv_bin)
            File.cp!("pglited/target/release/pglited", Path.join(build_priv_bin, "pglited"))

            Mix.shell().info("Fresh Rust port binary built ✓")

          {output, _} ->
            Mix.raise("cargo build --release failed:\n#{output}")
        end
    end
  end
end
