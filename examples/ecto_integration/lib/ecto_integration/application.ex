defmodule EctoIntegration.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    {:ok, manager} = Pglite.start_link(name: :ecto_integration_pglite)
    # Get connection options and remove socket path but keep socket_dir (like working tests)
    opts = Pglite.get_connection_opts(manager)

    # Keep socket_dir for Unix socket connection (like working tests)
    IO.puts("Connection options for Repo: #{inspect(opts)}")

    children = [ {EctoIntegration.Repo, opts} ]

    opts = [strategy: :one_for_one, name: EctoIntegration.Supervisor]
    Supervisor.start_link(children, opts)
  end

end
