defmodule EctoIntegration do
  @moduledoc """
  Ecto Integration Example

  This example demonstrates how to use PGLite with a proper Ecto project structure.

  The application automatically starts PGLite and the Ecto repo in a supervision tree.
  Run with: mix run --no-halt -e "EctoIntegration.run()"
  """

  alias EctoIntegration.Repo
  alias EctoIntegration.User
  import Ecto.Query

  def run do
    run_migrations()
    run_crud_operations()
    run_queries()
  end

  defp run_migrations do
    path = Application.app_dir(:ecto_integration, "priv/repo/migrations")

    Ecto.Migrator.with_repo(Repo, fn repo -> Ecto.Migrator.run(repo, path, :up, all: true) end)
  end

  defp run_crud_operations do
    # Create users
    {:ok, alice} =
      %User{}
      |> User.changeset(%{name: "Alice", email: "alice@example.com", age: 30})
      |> Repo.insert()

    {:ok, bob} =
      %User{}
      |> User.changeset(%{name: "Bob", email: "bob@example.com", age: 25})
      |> Repo.insert()

    IO.puts("✅ Created users: Alice and Bob")

    # Read users
    users = Repo.all(User)
    IO.puts("\n👥 All users:")

    Enum.each(users, fn user ->
      IO.puts("  #{user.name} (#{user.email}) - age #{user.age}")
    end)

    # Update user
    alice = Repo.get(User, alice.id)

    {:ok, updated_alice} =
      alice
      |> User.changeset(%{age: 31})
      |> Repo.update()

    IO.puts("✅ Updated Alice's age to #{updated_alice.age}")

    # Store IDs for cleanup demo
    {alice.id, bob.id}
  end

  defp run_queries do
    # Query with where clause
    young_users = Repo.all(from(u in User, where: u.age < 30))
    IO.puts("\n👶 Users under 30:")

    Enum.each(young_users, fn user ->
      IO.puts("  #{user.name} - age #{user.age}")
    end)

    # Count users
    user_count = Repo.aggregate(User, :count, :id)
    IO.puts("\n📊 Total users: #{user_count}")

    # Find user by email
    Repo.get_by(User, email: "alice@example.com") |> IO.inspect()
  end
end
