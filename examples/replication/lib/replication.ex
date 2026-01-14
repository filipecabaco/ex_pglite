defmodule ReadReplica do
  @moduledoc """
  A simple read-level cache using PostgreSQL with real-time replication.

  This module provides a local PostgreSQL cache that automatically syncs with a source database using
  PostgreSQL logical replication. Changes are streamed in real-time for fast local reads.
  """

  use GenServer
  require Logger

  defstruct [:pglite_manager, :cache_connection, :replication_pid, :handler_pid, :tables_to_sync]

  @spec start_link(map()) :: GenServer.on_start()
  def start_link(config), do: GenServer.start_link(__MODULE__, config, name: __MODULE__)
  def get_cache_connection(pid), do: GenServer.call(pid, :get_cache_connection)

  def init(config) do
    source_conn_opts = Map.fetch!(config, :source)

    with {:ok, manager} <- Pglite.start_link(),
         cache_conn_opts = Pglite.get_connection_opts(manager),
         {:ok, cache_pid} <- Postgrex.start_link(cache_conn_opts),
         source_conn_opts = Keyword.put(source_conn_opts, :cache_pid, cache_pid),
         {:ok, handler_pid} <- ReadReplica.Handler.start_link(source_conn_opts) do
      {:ok, %__MODULE__{pglite_manager: manager, cache_connection: cache_pid, handler_pid: handler_pid}}
    else
      reason ->
        {:stop, :normal, reason}
    end
  end

  def handle_call(:get_cache_connection, _from, state) do
    {:reply, state.cache_connection, state}
  end

  def terminate(_reason, state) do
    # Stop the handler (which will stop the replication process)
    if state.handler_pid && Process.alive?(state.handler_pid) do
      GenServer.stop(state.handler_pid, :normal, 1000)
    end

    # Stop the Postgrex connection
    if state.cache_connection && Process.alive?(state.cache_connection) do
      GenServer.stop(state.cache_connection, :normal, 1000)
    end

    # Stop the PGlite manager (this will cleanup the port)
    if state.pglite_manager && Process.alive?(state.pglite_manager) do
      GenServer.stop(state.pglite_manager, :normal, 2000)
    end

    :ok
  end
end
