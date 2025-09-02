defmodule ReadReplica.Handler do
  @moduledoc """
  Handles PostgreSQL logical replication messages using the postgres_replication library.

  This handler receives replication messages and processes them to sync changes
  from the source PostgreSQL database to the local PGLite cache.
  """

  @behaviour PostgresReplication.Handler

  use GenServer
  require Logger

  import PostgresReplication.Protocol
  import PostgresReplication.Plugin.Pgoutput.Decoder

  alias PostgresReplication.Protocol.Write
  alias PostgresReplication.Protocol.KeepAlive
  alias PostgresReplication.Plugin.Pgoutput.Decoder.Messages.Insert
  alias PostgresReplication.Plugin.Pgoutput.Decoder.Messages.Update
  alias PostgresReplication.Plugin.Pgoutput.Decoder.Messages.Delete
  alias PostgresReplication.Plugin.Pgoutput.Decoder.Messages.Commit
  alias PostgresReplication.Plugin.Pgoutput.Decoder.Messages.Begin
  alias PostgresReplication.Plugin.Pgoutput.Decoder.Messages.Relation
  alias PostgresReplication.Plugin.Pgoutput.Decoder.Messages.Truncate

  defstruct [:replication_pid, :replication_opts, relations: %{}, operations: [], cache_pid: nil]
  @type t :: %__MODULE__{replication_pid: pid(), replication_opts: PostgresReplication.t()}

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts)
  end

  def init(opts) do
    cache_pid = Keyword.get(opts, :cache_pid)

    replication_pots = %PostgresReplication{
      connection_opts: opts,
      table: :all,
      schema: "public",
      opts: [name: __MODULE__, auto_reconnect: true],
      handler_module: __MODULE__,
      metadata: %{ingestion_pid: self(), cache_pid: cache_pid}
    }

    {:ok, replication_pid} = PostgresReplication.start_link(replication_pots)
    state = %__MODULE__{replication_pid: replication_pid, replication_opts: replication_pots, cache_pid: cache_pid}
    :ok = dump(opts, cache_pid)
    {:ok, state}
  end

  def call(message, %PostgresReplication{metadata: %{ingestion_pid: ingestion_pid}}) when is_write(message) do
    %Write{message: message} = parse(message)

    message
    |> decode_message()
    |> then(&send(ingestion_pid, &1))

    :noreply
  end

  def call(message, _state) when is_keep_alive(message) do
    Logger.debug("Received keep-alive message")
    %KeepAlive{reply: reply, wal_end: wal_end} = PostgresReplication.Protocol.parse(message)

    case reply do
      :now -> {:reply, standby(wal_end + 1, wal_end + 1, wal_end + 1, reply)}
      :later -> {:reply, hold()}
    end
  end

  def call(message, _state) do
    Logger.debug("Received other message: #{inspect(message)}")
    :noreply
  end

  def handle_info(%Begin{}, state) do
    Logger.debug("Received begin message")
    {:noreply, %{state | operations: []}}
  end

  def handle_info(
        %Relation{id: id, columns: columns, name: name, namespace: namespace},
        %{relations: relations} = state
      ) do
    Logger.debug("Received relation message for relation #{id}")

    columns = Enum.map(columns, fn column -> {column.name, column.type, column.flags} end)

    {:noreply, %{state | relations: Map.put(relations, id, %{columns: columns, schema: namespace, table: name})}}
  end

  def handle_info(
        %Insert{relation_id: id, tuple_data: tuple_data},
        %{relations: relations, operations: operations} = state
      ) do
    Logger.debug("Received insert message for relation #{id}")
    %{schema: schema, table: table, columns: columns} = Map.get(relations, id)
    values = Tuple.to_list(tuple_data)
    terms = db_to_terms(columns, values, &insert_placeholder/2)

    values = Enum.map(terms, fn {_, value, _} -> value end)
    columns = columns |> Enum.map(fn {name, _, _} -> name end) |> Enum.join(", ")
    param_placeholders = Enum.map(terms, fn {placeholder, _, _} -> placeholder end) |> Enum.join(", ")

    query = "INSERT INTO #{schema}.#{table} (#{columns}) VALUES (#{param_placeholders})"
    {:noreply, %{state | operations: operations ++ [{:insert, query, values}]}}
  end

  def handle_info(
        %Update{relation_id: id, tuple_data: tuple_data},
        %{relations: relations, operations: operations} = state
      ) do
    %{schema: schema, table: table, columns: columns} = Map.get(relations, id)
    values = Tuple.to_list(tuple_data)
    terms = db_to_terms(columns, values, &update_placeholder/2)

    {keys, values} = terms |> Enum.split_with(fn {_, _, flags} -> flags != [] end)
    key_values = Enum.map(keys, fn {_, value, _} -> value end)
    value_values = Enum.map(values, fn {_, value, _} -> value end)
    key_placeholders = Enum.map(keys, fn {placeholder, _, _} -> placeholder end) |> Enum.join(", ")
    param_placeholders = Enum.map(values, fn {placeholder, _, _} -> placeholder end) |> Enum.join(", ")

    query = "UPDATE #{schema}.#{table} SET #{param_placeholders} WHERE #{key_placeholders}"
    {:noreply, %{state | operations: operations ++ [{:update, query, key_values ++ value_values}]}}
  end

  def handle_info(
        %Delete{relation_id: id, changed_key_tuple_data: changed_key_tuple_data},
        %{relations: relations, operations: operations} = state
      ) do
    Logger.debug("Received delete message for relation #{id}")
    %{schema: schema, table: table, columns: columns} = Map.get(relations, id)
    values = Tuple.to_list(changed_key_tuple_data)
    terms = db_to_terms(columns, values, &delete_placeholder/2)

    values = Enum.map(terms, fn {_, value, _} -> value end)
    param_placeholders = Enum.map(terms, fn {placeholder, _, _} -> placeholder end) |> Enum.join(", ")
    query = "DELETE FROM #{schema}.#{table} WHERE #{param_placeholders}"

    {:noreply, %{state | operations: operations ++ [{:delete, query, values}]}}
  end

  def handle_info(
        %Truncate{options: options, truncated_relations: truncated_relations},
        %{relations: relations, operations: operations} = state
      ) do
    Logger.debug("Received truncate message for relation #{inspect(truncated_relations)}")
    relations = Map.take(relations, truncated_relations)
    name = Enum.map(relations, fn {_, %{schema: schema, table: table}} -> "#{schema}.#{table}" end) |> Enum.join(", ")

    options =
      Enum.map(options, fn
        :restart_identity -> "RESTART IDENTITY"
        :continue_identity -> "CONTINUE IDENTITY"
        :cascade -> "CASCADE"
        :restrict -> "RESTRICT"
      end)
      |> Enum.join(" ")

    query = "TRUNCATE TABLE #{name} #{options}"

    {:noreply, %{state | operations: operations ++ [{:truncate, query}]}}
  end

  def handle_info(%Commit{}, %{cache_pid: cache_pid, operations: operations} = state) do
    Postgrex.transaction(cache_pid, fn pid ->
      Enum.each(operations, fn operation ->
        case operation do
          {:insert, query, values} -> Postgrex.query!(pid, query, values)
          {:delete, query, values} -> Postgrex.query!(pid, query, values)
          {:update, query, values} -> Postgrex.query!(pid, query, values)
          {:truncate, query} -> Postgrex.query!(pid, query, [])
          _ -> :ok
        end
      end)
    end)

    {:noreply, %{state | operations: []}}
  end

  def handle_info(message, state) do
    Logger.debug("Received other message: #{inspect(message)}")
    {:noreply, state}
  end

  defp dump(opts, cache_pid) do
    host = Keyword.get(opts, :host, "localhost")
    port = opts |> Keyword.get(:port, 5432) |> Integer.to_string()
    username = Keyword.get(opts, :username, "postgres")
    password = Keyword.get(opts, :password, "postgres")
    database = Keyword.get(opts, :database, "postgres")

    {content, 0} =
      System.cmd(
        "pg_dump",
        [
          "-h",
          host,
          "-p",
          port,
          "-U",
          username,
          "-d",
          database,
          "--schema=public",
          "--no-comments",
          "--column-inserts"
        ],
        env: [{"PGPASSWORD", password}]
      )

    content = Regex.replace(~r/\\(.*)/, content, "")
    content = Regex.replace(~r/--(.*)/, content, "")
    content = Regex.replace(~r/^SET(.*)^/, content, "")
    content = Regex.replace(~r/CREATE SCHEMA/, content, "CREATE SCHEMA IF NOT EXISTS")
    content = Regex.replace(~r/CREATE TABLE/, content, "CREATE TABLE IF NOT EXISTS")
    content = Regex.replace(~r/CREATE SEQUENCE/, content, "CREATE SEQUENCE IF NOT EXISTS")
    content = Regex.replace(~r/ALTER SCHEMA public OWNER TO pg_database_owner;/, content, "")
    content = Regex.replace(~r/\n|\t/, content, " ")
    content = Regex.replace(~r/;/, content, ";\n")
    File.write!("schema.sql", content)

    content
    |> String.split("\n")
    |> Enum.reject(&(String.trim(&1) == ""))
    |> Enum.each(fn sql ->
      dbg(sql)
      sql = String.trim(sql)
      Postgrex.query!(cache_pid, sql, [])
    end)

    :ok
  end

  defp db_to_terms(columns, values, placeholder_fn) do
    columns
    |> Enum.zip(values)
    |> Enum.reject(fn {_, value} -> is_nil(value) end)
    |> Enum.with_index(1)
    |> Enum.map(fn {{{name, type, flags}, value}, index} ->
      {placeholder_fn.(name, index), db_to_term(type, value), flags}
    end)
  end

  defp db_to_term(type, value) do
    cond do
      String.starts_with?(type, "int") -> String.to_integer(value)
      type == "bool" -> value == "t"
      type == "timestamp" -> NaiveDateTime.from_iso8601!(value)
      true -> value
    end
  end

  defp insert_placeholder(_name, index), do: "$#{index}"

  defp update_placeholder(name, index), do: "#{name} = $#{index}"

  defp delete_placeholder(name, index), do: "#{name} = $#{index}"
end
