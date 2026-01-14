defmodule Benchmark.WorkloadRunner do
  @moduledoc """
  Generates and executes database workloads at configurable intensities.
  Runs as a GenServer that continuously executes operations at the configured rate.
  Stats are stored in ETS for lock-free reads during benchmark progress reporting.
  """

  use GenServer

  defstruct [
    :conn,
    :schema_type,
    :intensity_profile,
    :running,
    :operations,
    :timer_ref,
    :stats_table
  ]

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts)
  end

  @doc """
  Get stats table reference for direct ETS reads.
  This is the preferred way to read stats during benchmarks.
  """
  def get_stats_table(pid) do
    GenServer.call(pid, :get_stats_table, 5000)
  end

  @doc """
  Read stats directly from an ETS table (no GenServer call needed).
  """
  def read_stats_from_ets(nil), do: empty_stats()
  def read_stats_from_ets(table) do
    try do
      reads = ets_counter(table, :reads)
      writes = ets_counter(table, :writes)
      transactions = ets_counter(table, :transactions)
      errors = ets_counter(table, :errors)
      total_latency = ets_counter(table, :total_latency_us)
      latencies = case :ets.lookup(table, :latencies) do
        [{:latencies, l}] -> l
        _ -> []
      end

      total_ops = reads + writes + transactions
      avg_latency_us = if total_ops > 0, do: total_latency / total_ops, else: 0

      latency_stats =
        if length(latencies) > 0 do
          sorted = Enum.sort(latencies)
          count = length(sorted)

          %{
            min_us: Enum.min(sorted),
            max_us: Enum.max(sorted),
            avg_us: avg_latency_us,
            p50_us: Enum.at(sorted, div(count * 50, 100)) || 0,
            p95_us: Enum.at(sorted, div(count * 95, 100)) || 0,
            p99_us: Enum.at(sorted, div(count * 99, 100)) || 0
          }
        else
          %{min_us: 0, max_us: 0, avg_us: 0, p50_us: 0, p95_us: 0, p99_us: 0}
        end

      %{
        total_operations: total_ops,
        reads: reads,
        writes: writes,
        transactions: transactions,
        errors: errors,
        error_rate: if(total_ops > 0, do: errors / total_ops, else: 0),
        latency: latency_stats
      }
    rescue
      ArgumentError -> empty_stats()
    end
  end

  defp ets_counter(table, key) do
    case :ets.lookup(table, key) do
      [{^key, val}] -> val
      _ -> 0
    end
  end

  defp empty_stats do
    %{
      total_operations: 0,
      reads: 0,
      writes: 0,
      transactions: 0,
      errors: 0,
      error_rate: 0,
      latency: %{min_us: 0, max_us: 0, avg_us: 0, p50_us: 0, p95_us: 0, p99_us: 0}
    }
  end

  def stop(pid) do
    GenServer.stop(pid)
  end

  @impl true
  def init(opts) do
    conn = Keyword.fetch!(opts, :conn)
    schema_type = Keyword.get(opts, :schema_type, :simple)
    intensity_profile = Keyword.fetch!(opts, :intensity_profile)
    operations = Keyword.get(opts, :operations, [:read, :write, :transaction])

    stats_table = :ets.new(:workload_stats, [:set, :public, {:write_concurrency, true}])
    :ets.insert(stats_table, {:reads, 0})
    :ets.insert(stats_table, {:writes, 0})
    :ets.insert(stats_table, {:transactions, 0})
    :ets.insert(stats_table, {:errors, 0})
    :ets.insert(stats_table, {:total_latency_us, 0})
    :ets.insert(stats_table, {:latencies, []})

    interval_ms = round(1000 / intensity_profile.ops_per_second)
    timer_ref = :timer.send_interval(max(interval_ms, 1), :execute_batch)

    {:ok,
     %__MODULE__{
       conn: conn,
       schema_type: schema_type,
       intensity_profile: intensity_profile,
       operations: operations,
       timer_ref: timer_ref,
       running: true,
       stats_table: stats_table
     }}
  end

  @impl true
  def handle_call(:get_stats_table, _from, state) do
    {:reply, state.stats_table, state}
  end

  @impl true
  def handle_call(:get_stats, _from, state) do
    summary = read_stats_from_ets(state.stats_table)
    {:reply, summary, state}
  end

  @impl true
  def handle_info(:execute_batch, %{running: false} = state) do
    {:noreply, state}
  end

  @impl true
  def handle_info(:execute_batch, state) do
    batch_size = state.intensity_profile.batch_size
    execute_operations(state, batch_size)
    {:noreply, state}
  end

  @impl true
  def terminate(_reason, state) do
    if state.timer_ref, do: :timer.cancel(state.timer_ref)
    if state.stats_table, do: :ets.delete(state.stats_table)
    :ok
  end

  defp execute_operations(state, count) do
    Enum.each(1..count, fn _ ->
      op_type = pick_operation(state.intensity_profile, state.operations)
      {result, latency_us} = measure_operation(state.conn, state.schema_type, op_type)

      update_stats_ets(state.stats_table, op_type, result, latency_us)
    end)
  end

  defp pick_operation(profile, available_ops) do
    rand = :rand.uniform()

    if rand < profile.transaction_probability and :transaction in available_ops do
      :transaction
    else
      remaining_rand = :rand.uniform()

      cond do
        remaining_rand < profile.read_write_ratio and :read in available_ops ->
          :read

        :write in available_ops ->
          :write

        true ->
          Enum.random(available_ops)
      end
    end
  end

  defp measure_operation(conn, schema_type, op_type) do
    start = System.monotonic_time(:microsecond)

    result =
      try do
        execute_operation(conn, schema_type, op_type)
        :ok
      rescue
        _ -> :error
      catch
        _, _ -> :error
      end

    elapsed = System.monotonic_time(:microsecond) - start
    {result, elapsed}
  end

  defp execute_operation(conn, :simple, :read) do
    query =
      Enum.random([
        "SELECT * FROM benchmark_items WHERE id = $1",
        "SELECT * FROM benchmark_items WHERE value > $1 LIMIT 10",
        "SELECT COUNT(*) FROM benchmark_items WHERE name LIKE $1",
        "SELECT AVG(value) FROM benchmark_items"
      ])

    params =
      case query do
        "SELECT * FROM benchmark_items WHERE id = $1" -> [:rand.uniform(1000)]
        "SELECT * FROM benchmark_items WHERE value > $1 LIMIT 10" -> [:rand.uniform(5000)]
        "SELECT COUNT(*) FROM benchmark_items WHERE name LIKE $1" -> ["item_#{:rand.uniform(100)}%"]
        _ -> []
      end

    Postgrex.query!(conn, query, params)
  end

  defp execute_operation(conn, :simple, :write) do
    query =
      Enum.random([
        :insert,
        :update,
        :delete
      ])

    case query do
      :insert ->
        Postgrex.query!(conn,
          "INSERT INTO benchmark_items (name, value) VALUES ($1, $2)",
          ["bench_#{:rand.uniform(100000)}", :rand.uniform(10000)]
        )

      :update ->
        Postgrex.query!(conn,
          "UPDATE benchmark_items SET value = $1 WHERE id = $2",
          [:rand.uniform(10000), :rand.uniform(1000)]
        )

      :delete ->
        Postgrex.query!(conn,
          "DELETE FROM benchmark_items WHERE id = $1",
          [:rand.uniform(1000)]
        )
    end
  end

  defp execute_operation(conn, :simple, :transaction) do
    Postgrex.transaction(conn, fn tx_conn ->
      id1 = :rand.uniform(1000)
      id2 = :rand.uniform(1000)

      Postgrex.query!(tx_conn, "SELECT value FROM benchmark_items WHERE id = $1 FOR UPDATE", [id1])
      Postgrex.query!(tx_conn, "UPDATE benchmark_items SET value = value + 1 WHERE id = $1", [id1])
      Postgrex.query!(tx_conn, "UPDATE benchmark_items SET value = value - 1 WHERE id = $1", [id2])
    end)
  end

  defp execute_operation(conn, :complex, :read) do
    query =
      Enum.random([
        {"SELECT u.*, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.id = $1 GROUP BY u.id",
         [:rand.uniform(100)]},
        {"SELECT p.*, c.name as category_name FROM products p JOIN categories c ON c.id = p.category_id WHERE p.price < $1 LIMIT 20",
         [Decimal.new("#{:rand.uniform(100)}")]},
        {"SELECT o.*, SUM(oi.quantity * oi.unit_price) as total FROM orders o JOIN order_items oi ON oi.order_id = o.id WHERE o.status = $1 GROUP BY o.id LIMIT 10",
         [Enum.random(["pending", "processing", "shipped"])]},
        {"SELECT c.name, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id, c.name",
         []}
      ])

    {q, p} = query
    Postgrex.query!(conn, q, p)
  end

  defp execute_operation(conn, :complex, :write) do
    action = Enum.random([:insert_user, :insert_product, :update_stock, :create_order])

    case action do
      :insert_user ->
        email = "bench#{:rand.uniform(1_000_000)}@test.com"
        Postgrex.query!(conn,
          "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
          [email, "user_#{:rand.uniform(10000)}", "hash"]
        )

      :insert_product ->
        Postgrex.query!(conn,
          "INSERT INTO products (name, description, price, category_id, stock_quantity) VALUES ($1, $2, $3, $4, $5)",
          ["Product #{:rand.uniform(100000)}", "Desc", Decimal.new("#{:rand.uniform(10000) / 100}"),
           :rand.uniform(20), :rand.uniform(1000)]
        )

      :update_stock ->
        Postgrex.query!(conn,
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1",
          [:rand.uniform(5), :rand.uniform(500)]
        )

      :create_order ->
        Postgrex.query!(conn,
          "INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3)",
          [:rand.uniform(100), Decimal.new("#{:rand.uniform(10000) / 100}"), "pending"]
        )
    end
  end

  defp execute_operation(conn, :complex, :transaction) do
    Postgrex.transaction(conn, fn tx_conn ->
      user_id = :rand.uniform(100)
      product_id = :rand.uniform(500)
      quantity = :rand.uniform(3)

      {:ok, product} = Postgrex.query(tx_conn,
        "SELECT id, price, stock_quantity FROM products WHERE id = $1 FOR UPDATE",
        [product_id]
      )

      case product.rows do
        [[_id, price, stock]] when stock >= quantity ->
          Postgrex.query!(tx_conn,
            "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
            [quantity, product_id]
          )

          total = Decimal.mult(price, quantity)
          {:ok, order} = Postgrex.query(tx_conn,
            "INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, 'pending') RETURNING id",
            [user_id, total]
          )

          [[order_id]] = order.rows
          Postgrex.query!(tx_conn,
            "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
            [order_id, product_id, quantity, price]
          )

        _ ->
          :ok
      end
    end)
  end

  defp execute_operation(conn, :realistic, :read) do
    query =
      Enum.random([
        {"SELECT r.*, a.email as creator_email FROM resources r LEFT JOIN events e ON e.resource_id = r.id LEFT JOIN accounts a ON a.id = e.actor_id WHERE r.tenant_id = $1 AND r.type = $2 AND NOT r.is_deleted LIMIT 20",
         [get_random_tenant_id(conn), Enum.random(["document", "image", "config"])]},
        {"SELECT e.*, r.name as resource_name FROM events e LEFT JOIN resources r ON r.id = e.resource_id WHERE e.tenant_id = $1 ORDER BY e.occurred_at DESC LIMIT 50",
         [get_random_tenant_id(conn)]},
        {"SELECT a.*, COUNT(e.id) as event_count FROM accounts a LEFT JOIN events e ON e.actor_id = a.id WHERE a.tenant_id = $1 GROUP BY a.id LIMIT 10",
         [get_random_tenant_id(conn)]},
        {"SELECT data->>'content' as content, metadata->>'priority' as priority FROM resources WHERE tenant_id = $1 AND type = $2 LIMIT 10",
         [get_random_tenant_id(conn), "document"]}
      ])

    {q, p} = query
    Postgrex.query!(conn, q, p)
  end

  defp execute_operation(conn, :realistic, :write) do
    tenant_id = get_random_tenant_id(conn)
    action = Enum.random([:create_resource, :update_resource, :log_event])

    case action do
      :create_resource ->
        data = Jason.encode!(%{content: "New content", size: :rand.uniform(10000)})
        metadata = Jason.encode!(%{tags: [], priority: :rand.uniform(5)})

        Postgrex.query!(conn,
          "INSERT INTO resources (tenant_id, type, name, data, metadata) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)",
          [tenant_id, Enum.random(["document", "image"]), "Resource #{:rand.uniform(100000)}", data, metadata]
        )

      :update_resource ->
        new_data = Jason.encode!(%{content: "Updated", size: :rand.uniform(10000)})

        Postgrex.query!(conn,
          "UPDATE resources SET data = $1::jsonb, version = version + 1, updated_at = NOW() WHERE tenant_id = $2 AND NOT is_deleted ORDER BY RANDOM() LIMIT 1",
          [new_data, tenant_id]
        )

      :log_event ->
        payload = Jason.encode!(%{action: "benchmark", timestamp: DateTime.utc_now()})

        Postgrex.query!(conn,
          "INSERT INTO events (tenant_id, event_type, payload) VALUES ($1, $2, $3::jsonb)",
          [tenant_id, Enum.random(["viewed", "updated", "exported"]), payload]
        )
    end
  end

  defp execute_operation(conn, :realistic, :transaction) do
    tenant_id = get_random_tenant_id(conn)

    Postgrex.transaction(conn, fn tx_conn ->
      {:ok, resource} = Postgrex.query(tx_conn,
        "SELECT id, version, data FROM resources WHERE tenant_id = $1 AND NOT is_deleted ORDER BY RANDOM() LIMIT 1 FOR UPDATE",
        [tenant_id]
      )

      case resource.rows do
        [[resource_id, version, old_data]] ->
          new_data = Jason.encode!(Map.merge(Jason.decode!(old_data), %{"updated" => true}))

          Postgrex.query!(tx_conn,
            "UPDATE resources SET data = $1::jsonb, version = $2, updated_at = NOW() WHERE id = $3",
            [new_data, version + 1, resource_id]
          )

          {:ok, actor} = Postgrex.query(tx_conn,
            "SELECT id FROM accounts WHERE tenant_id = $1 LIMIT 1",
            [tenant_id]
          )

          actor_id = case actor.rows do
            [[id]] -> id
            _ -> nil
          end

          Postgrex.query!(tx_conn,
            "INSERT INTO audit_logs (tenant_id, account_id, action, resource_type, resource_id, old_value, new_value) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)",
            [tenant_id, actor_id, "update", "resource", resource_id, old_data, new_data]
          )

          Postgrex.query!(tx_conn,
            "INSERT INTO events (tenant_id, resource_id, event_type, payload, actor_id) VALUES ($1, $2, $3, $4::jsonb, $5)",
            [tenant_id, resource_id, "updated", Jason.encode!(%{version: version + 1}), actor_id]
          )

        _ ->
          :ok
      end
    end)
  end

  defp get_random_tenant_id(conn) do
    {:ok, result} = Postgrex.query(conn, "SELECT id FROM tenants ORDER BY RANDOM() LIMIT 1", [])
    case result.rows do
      [[id]] -> id
      _ -> nil
    end
  end

  defp update_stats_ets(table, op_type, result, latency_us) do
    update_op_count_ets(table, op_type, result)
    update_latencies_ets(table, latency_us)
  end

  defp update_op_count_ets(table, :read, :ok), do: :ets.update_counter(table, :reads, 1)
  defp update_op_count_ets(table, :write, :ok), do: :ets.update_counter(table, :writes, 1)
  defp update_op_count_ets(table, :transaction, :ok), do: :ets.update_counter(table, :transactions, 1)
  defp update_op_count_ets(table, _, :error), do: :ets.update_counter(table, :errors, 1)

  defp update_latencies_ets(table, latency_us) do
    :ets.update_counter(table, :total_latency_us, latency_us)

    case :ets.lookup(table, :latencies) do
      [{:latencies, latencies}] ->
        new_latencies = [latency_us | Enum.take(latencies, 999)]
        :ets.insert(table, {:latencies, new_latencies})
      _ ->
        :ets.insert(table, {:latencies, [latency_us]})
    end
  end
end
