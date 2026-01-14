#!/usr/bin/env elixir

# PGlite Replication Demo - Quick Start Script
# This script sets up everything needed to run the demo

IO.puts("\n🚀 PGLite Replication Demo - Quick Start")
IO.puts(String.duplicate("=", 50))
IO.puts("")

# Check if docker-compose is available
case System.cmd("which", ["docker-compose"], stderr_to_stdout: true) do
  {_, 0} ->
    :ok

  _ ->
    IO.puts("❌ docker-compose not found. Please install Docker first.")
    System.halt(1)
end

# Check if mix is available
case System.cmd("which", ["mix"], stderr_to_stdout: true) do
  {_, 0} ->
    :ok

  _ ->
    IO.puts("❌ mix not found. Please install Elixir first.")
    System.halt(1)
end

IO.puts("1️⃣  Starting PostgreSQL with sample data...")

case System.cmd("docker-compose", ["up", "-d"], stderr_to_stdout: true) do
  {output, 0} ->
    if String.contains?(output, "Started") or String.contains?(output, "Running") do
      IO.puts("   ✓ PostgreSQL container started")
    end

  {error, _} ->
    IO.puts("❌ Failed to start PostgreSQL: #{error}")
    System.halt(1)
end

IO.puts("")
IO.puts("2️⃣  Waiting for PostgreSQL to be ready...")
Process.sleep(3000)

# Wait for PostgreSQL to be ready (max 10 attempts)
postgres_ready =
  Enum.reduce_while(1..10, false, fn attempt, _acc ->
    case System.cmd("docker-compose", ["exec", "-T", "postgres", "pg_isready", "-U", "postgres"],
           stderr_to_stdout: true
         ) do
      {output, 0} ->
        if String.contains?(output, "accepting connections") do
          {:halt, true}
        else
          Process.sleep(1000)
          {:cont, false}
        end

      _ ->
        if attempt == 10 do
          {:halt, false}
        else
          Process.sleep(1000)
          {:cont, false}
        end
    end
  end)

if postgres_ready do
  IO.puts("   ✅ PostgreSQL is ready!")
else
  IO.puts("❌ PostgreSQL failed to start")
  System.halt(1)
end

IO.puts("")
IO.puts("3️⃣  Installing dependencies...")

case System.cmd("mix", ["deps.get"], stderr_to_stdout: true, cd: __DIR__) do
  {_, 0} ->
    IO.puts("   ✓ Dependencies installed")

  {error, _} ->
    IO.puts("❌ Failed to install dependencies: #{error}")
    System.halt(1)
end

IO.puts("")
IO.puts("4️⃣  Compiling project...")

case System.cmd("mix", ["compile"], stderr_to_stdout: true, cd: __DIR__) do
  {_, 0} ->
    IO.puts("   ✓ Project compiled")

  {error, _} ->
    IO.puts("❌ Failed to compile: #{error}")
    System.halt(1)
end

IO.puts("")
IO.puts("✨ Setup complete!")
IO.puts("")
IO.puts("📊 Database contains:")

# Get user count
{user_output, 0} =
  System.cmd(
    "docker-compose",
    ["exec", "-T", "postgres", "psql", "-U", "postgres", "-d", "postgres", "-tAc",
     "SELECT COUNT(*) FROM users;"],
    stderr_to_stdout: true
  )

user_count = String.trim(user_output)

# Get post count
{post_output, 0} =
  System.cmd(
    "docker-compose",
    ["exec", "-T", "postgres", "psql", "-U", "postgres", "-d", "postgres", "-tAc",
     "SELECT COUNT(*) FROM posts;"],
    stderr_to_stdout: true
  )

post_count = String.trim(post_output)

IO.puts("   • #{user_count} users")
IO.puts("   • #{post_count} posts")
IO.puts("")
IO.puts("🎯 Now run: mix demo")
IO.puts("")
IO.puts("💡 Tip: In another terminal, connect to PostgreSQL to test replication:")
IO.puts("   psql postgres://postgres:postgres@localhost:5432/postgres")
IO.puts("")
