defmodule Mix.Tasks.Pglite.Build do
  use Mix.Task

  @shortdoc "Builds new PGLite bundle using bun build"
  @requirements ["app.config"]

  def run(_args) do
    Mix.shell().info("🚀 Building new PGLite bundle...")

    # Check if bun is available
    case System.find_executable("bun") do
      nil ->
        Mix.shell().error("❌ Error: bun is not installed or not in PATH")
        Mix.shell().error("Please install bun from https://bun.sh/")
        System.halt(1)

      _bun_path ->
        build_bundle()
    end
  end

  defp build_bundle do
    # Create output directory
    File.mkdir_p!("priv/pglite")

    # Generate a unique hash for the bundle name
    hash = generate_bundle_hash()
    bundle_name = "pglite_optimized_#{hash}.ts"

    Mix.shell().info("📦 Creating bundle: #{bundle_name}")

    # Build the bundle using bun
    case System.cmd("bun", [
           "build",
           "priv/bun/index.ts",
           "--outfile",
           bundle_name,
           "--target",
           "bun",
           "--minify",
           "--sourcemap"
         ]) do
      {_output, 0} ->
        # Copy the new bundle to priv/pglite
        Mix.shell().info("📁 Copying bundle to priv/pglite/")
        File.cp!(bundle_name, "priv/pglite/index.js")

        # Copy WebAssembly files
        Mix.shell().info("📋 Copying WebAssembly files...")
        File.cp!("pglite.wasm", "priv/pglite/")
        File.cp!("pglite.data", "priv/pglite/")

        # Clean up old bundles (keep only the latest 3)
        cleanup_old_bundles()

        Mix.shell().info("✅ Bundle built successfully!")
        Mix.shell().info("📦 New bundle: #{bundle_name}")
        Mix.shell().info("📁 Installed in: priv/pglite/pglite_socket_server.js")
        Mix.shell().info("🧹 Old bundles cleaned up")

      {error, _code} ->
        Mix.shell().error("❌ Bundle build failed:")
        Mix.shell().error(error)
        System.halt(1)
    end
  end

  defp generate_bundle_hash do
    timestamp = System.system_time(:second)
    git_hash = get_git_hash()

    :crypto.hash(:sha256, "pglite_#{timestamp}_#{git_hash}")
    |> Base.encode16(case: :lower)
    |> binary_part(0, 8)
  end

  defp get_git_hash do
    case System.cmd("git", ["rev-parse", "--short", "HEAD"]) do
      {hash, 0} -> String.trim(hash)
      _ -> "dev"
    end
  end

  defp cleanup_old_bundles do
    # Find all pglite_optimized_*.ts files and keep only the latest 3
    case File.ls(".") do
      {:ok, files} ->
        old_bundles =
          files
          |> Enum.filter(&String.starts_with?(&1, "pglite_optimized_"))
          |> Enum.sort()
          |> Enum.reverse()
          |> Enum.drop(3)

        Enum.each(old_bundles, fn bundle ->
          File.rm!(bundle)
          Mix.shell().info("🗑️  Removed old bundle: #{bundle}")
        end)

      _ ->
        Mix.shell().info("ℹ️  No old bundles to clean up")
    end
  end
end
