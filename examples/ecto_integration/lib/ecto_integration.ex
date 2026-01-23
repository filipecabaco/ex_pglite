defmodule EctoIntegration do
  @moduledoc """
  Using PGlite with Ecto.

  Run with: mix run --no-halt -e "EctoIntegration.run()"
  """

  alias EctoIntegration.Repo
  alias EctoIntegration.User
  import Ecto.Query

  def run do
    run_migrations()
    run_crud_operations()
    run_queries()
    run_concurrent_stress_test()
  end

  def hello, do: :world

  defp run_migrations do
    path = Application.app_dir(:ecto_integration, "priv/repo/migrations")
    Ecto.Migrator.with_repo(Repo, fn repo -> Ecto.Migrator.run(repo, path, :up, all: true) end)
  end

  defp run_crud_operations do
    {:ok, alice} =
      %User{}
      |> User.changeset(%{name: "Alice", email: "alice@example.com", age: 30})
      |> Repo.insert()

    {:ok, _bob} =
      %User{}
      |> User.changeset(%{name: "Bob", email: "bob@example.com", age: 25})
      |> Repo.insert()

    IO.puts("Created users: Alice and Bob")

    users = Repo.all(User)
    IO.puts("\nAll users:")

    Enum.each(users, fn user ->
      IO.puts("  #{user.name} (#{user.email}) - age #{user.age}")
    end)

    alice = Repo.get(User, alice.id)

    {:ok, updated_alice} =
      alice
      |> User.changeset(%{age: 31})
      |> Repo.update()

    IO.puts("Updated Alice's age to #{updated_alice.age}")
  end

  defp run_queries do
    young_users = Repo.all(from(u in User, where: u.age < 30))
    IO.puts("\nUsers under 30:")

    Enum.each(young_users, fn user ->
      IO.puts("  #{user.name} - age #{user.age}")
    end)

    user_count = Repo.aggregate(User, :count, :id)
    IO.puts("\nTotal users: #{user_count}")

    user = Repo.get_by(User, email: "alice@example.com")
    IO.puts("Found user by email: #{user.name}")
  end

  defp run_concurrent_stress_test do
    IO.puts("\n=== Concurrent Stress Test (pool_size: 5) ===")

    scenarios = [
      {10, 5, "Light load"},
      {20, 10, "Medium load"},
      {30, 10, "Heavy load"}
    ]

    Enum.each(scenarios, fn {num_tasks, queries_per_task, label} ->
      run_stress_scenario(num_tasks, queries_per_task, label)
    end)
  end

  defp run_stress_scenario(num_tasks, queries_per_task, label) do
    IO.puts("\n--- #{label}: #{num_tasks} tasks x #{queries_per_task} queries ---")

    start_time = System.monotonic_time(:millisecond)

    tasks =
      for task_id <- 1..num_tasks do
        Task.async(fn ->
          results =
            for _query_num <- 1..queries_per_task do
              Repo.aggregate(User, :count, :id)
            end

          {task_id, length(results)}
        end)
      end

    results = Task.await_many(tasks, 60_000)

    elapsed = System.monotonic_time(:millisecond) - start_time
    total_queries = num_tasks * queries_per_task
    qps = if elapsed > 0, do: Float.round(total_queries / (elapsed / 1000), 2), else: 0.0

    IO.puts("✓ Completed #{total_queries} queries in #{elapsed}ms (#{qps} qps)")
    IO.puts("✓ All #{length(results)} tasks completed")
  end
end
