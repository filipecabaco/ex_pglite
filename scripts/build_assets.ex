defmodule Pglite.BuildAssets do
  @moduledoc """
  Quick Elixir support module for building and moving PGLite assets.
  This module is designed to be used in mix aliases for building optimized assets.
  """

  @doc """
  Builds the optimized PGLite bundle and moves assets to the correct folders.
  This is the main function to be called from mix aliases.
  """
  def build_and_move do
    IO.puts("Building PGLite assets...")

    with :ok <- check_bun_available(),
         :ok <- build_bundle(),
         :ok <- move_assets(),
         :ok <- cleanup_old_bundles() do
      IO.puts("PGLite assets built and moved successfully")
      :ok
    else
      {:error, reason} ->
        IO.puts("Failed to build assets: #{reason}")
        {:error, reason}
    end
  end

  @doc """
  Quick build function that can be called directly.
  """
  def build do
    build_and_move()
  end

  @doc """
  Clean build - removes existing assets and rebuilds everything.
  """
  def clean_build do
    IO.puts("Cleaning existing assets")

    with :ok <- clean_existing_assets(),
         :ok <- build_and_move() do
      :ok
    else
      {:error, reason} ->
        {:error, reason}
    end
  end

  defp check_bun_available do
    case System.find_executable("bun") do
      nil ->
        {:error, "bun is not installed or not in PATH. Please install from https://bun.sh/"}
      bun_path ->
        # Cache the bun path for faster subsequent builds
        Process.put(:bun_path, bun_path)
        :ok
    end
  end

  defp get_bun_path do
    Process.get(:bun_path) || System.find_executable("bun")
  end

  defp build_bundle do
    # Create output directory
    File.mkdir_p!("priv/pglite")

    IO.puts("Creating optimized bundle directly in priv/pglite/")
    case System.cmd(get_bun_path(), ["install"], cd: "priv/pglite") do
      {_output, 0} ->
        IO.puts("Bun installed successfully")
        :ok
      {error, _code} ->
        {:error, "Bun install failed: #{error}"}
    end
    # Build using bun with maximum optimization flags, output directly to priv/pglite
    case System.cmd(get_bun_path(), [
           "build",
           "priv/pglite/index.ts",
           "--outfile",
           "priv/pglite/index.js",
           "--target",
           "bun",
           "--minify",
           "--compress",
           "--tree-shaking",
           "--external",
           "bun:*"
         ]) do
      {_output, 0} ->
        IO.puts("Bundle built successfully")
        :ok
      {error, _code} ->
        {:error, "Bundle build failed: #{error}"}
    end
  end

  defp move_assets do
    IO.puts("Copying WebAssembly files to priv/pglite/")

    # Copy WebAssembly files if they exist
    copy_if_exists("pglite.wasm", "priv/pglite/pglite.wasm")
    copy_if_exists("pglite.data", "priv/pglite/pglite.data")

    IO.puts("Assets ready")
    :ok
  end

  defp copy_if_exists(source, destination) do
    if File.exists?(source) do
      File.cp!(source, destination)
      IO.puts("Copied #{source}")
    else
      IO.puts("Warning: #{source} not found, skipping")
    end
  end





  defp cleanup_old_bundles do
    # No cleanup needed since we build directly to the target location
    :ok
  end

  defp clean_existing_assets do
    IO.puts("Removing priv/pglite/ directory...")
    File.rm_rf!("priv/pglite")

    IO.puts("Removing tmp/ directory...")
    File.rm_rf!("tmp")

    IO.puts("Cleanup completed")
    :ok
  end
end
