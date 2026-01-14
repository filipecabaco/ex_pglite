defmodule Benchmark.DataGenerator do
  @moduledoc """
  Generates test data for benchmark schemas.
  """

  defp uuid_to_string(<<a::binary-size(4), b::binary-size(2), c::binary-size(2), d::binary-size(2), e::binary-size(6)>>) do
    Base.encode16(a, case: :lower) <> "-" <>
    Base.encode16(b, case: :lower) <> "-" <>
    Base.encode16(c, case: :lower) <> "-" <>
    Base.encode16(d, case: :lower) <> "-" <>
    Base.encode16(e, case: :lower)
  end

  defp uuid_to_string(value) when is_binary(value), do: value

  def seed_data(conn, :simple, row_count) do
    batch_size = 100
    batches = div(row_count, batch_size)
    remainder = rem(row_count, batch_size)

    if batches > 0 do
      for batch <- 0..(batches - 1) do
        insert_simple_batch(conn, batch * batch_size, batch_size)
      end
    end

    if remainder > 0 do
      insert_simple_batch(conn, batches * batch_size, remainder)
    end

    row_count
  end

  def seed_data(conn, :complex, row_count) do
    user_count = div(row_count, 10)
    category_count = 20
    product_count = div(row_count, 2)
    order_count = div(row_count, 5)

    seed_categories(conn, category_count)
    seed_users(conn, user_count)
    seed_products(conn, product_count, category_count)
    seed_orders(conn, order_count, user_count, product_count)

    user_count + category_count + product_count + order_count
  end

  def seed_data(conn, :realistic, row_count) do
    tenant_count = max(1, div(row_count, 1000))
    accounts_per_tenant = div(row_count, 10) |> div(tenant_count) |> max(1)
    resources_per_tenant = div(row_count, 2) |> div(tenant_count) |> max(1)
    events_per_tenant = div(row_count, 4) |> div(tenant_count) |> max(1)

    tenant_ids = seed_tenants(conn, tenant_count)

    for tenant_id <- tenant_ids do
      account_ids = seed_accounts(conn, tenant_id, accounts_per_tenant)
      resource_ids = seed_resources(conn, tenant_id, resources_per_tenant)
      seed_events(conn, tenant_id, resource_ids, account_ids, events_per_tenant)
    end

    tenant_count * (1 + accounts_per_tenant + resources_per_tenant + events_per_tenant)
  end

  defp insert_simple_batch(conn, offset, count) do
    values =
      Enum.map(0..(count - 1), fn i ->
        idx = offset + i
        "('item_#{idx}', #{:rand.uniform(10000)})"
      end)
      |> Enum.join(", ")

    Postgrex.query!(conn, "INSERT INTO benchmark_items (name, value) VALUES #{values}", [])
  end

  defp seed_categories(conn, count) do
    for i <- 1..count do
      parent_id = if i > 5, do: :rand.uniform(5), else: nil
      params = if parent_id, do: ["Category #{i}", parent_id, i], else: ["Category #{i}", i]
      query =
        if parent_id do
          "INSERT INTO categories (name, parent_id, sort_order) VALUES ($1, $2, $3)"
        else
          "INSERT INTO categories (name, sort_order) VALUES ($1, $2)"
        end
      Postgrex.query!(conn, query, params)
    end
  end

  defp seed_users(conn, count) do
    batch_size = 50

    Enum.chunk_every(1..count, batch_size)
    |> Enum.each(fn batch ->
      values =
        Enum.map(batch, fn i ->
          "('user#{i}@example.com', 'user#{i}', 'hash#{i}', 'active')"
        end)
        |> Enum.join(", ")

      Postgrex.query!(conn, "INSERT INTO users (email, username, password_hash, status) VALUES #{values}", [])
    end)
  end

  defp seed_products(conn, count, category_count) do
    batch_size = 50

    Enum.chunk_every(1..count, batch_size)
    |> Enum.each(fn batch ->
      values =
        Enum.map(batch, fn i ->
          price = :rand.uniform(10000) / 100
          category_id = :rand.uniform(category_count)
          stock = :rand.uniform(1000)
          "('Product #{i}', 'Description for product #{i}', #{price}, #{category_id}, #{stock}, true)"
        end)
        |> Enum.join(", ")

      Postgrex.query!(conn,
        "INSERT INTO products (name, description, price, category_id, stock_quantity, is_active) VALUES #{values}",
        []
      )
    end)
  end

  defp seed_orders(conn, count, user_count, product_count) do
    batch_size = 50

    # Generate all order data upfront
    orders_data = for _ <- 1..count do
      user_id = :rand.uniform(user_count)
      total = :rand.uniform(100000) / 100
      status = Enum.random(["pending", "processing", "shipped", "delivered"])
      {user_id, total, status}
    end

    # Batch insert orders and collect IDs
    order_ids =
      orders_data
      |> Enum.chunk_every(batch_size)
      |> Enum.flat_map(fn batch ->
        values =
          Enum.map_join(batch, ", ", fn {user_id, total, status} ->
            "(#{user_id}, #{total}, '#{status}')"
          end)

        {:ok, result} =
          Postgrex.query(conn,
            "INSERT INTO orders (user_id, total_amount, status) VALUES #{values} RETURNING id",
            []
          )

        Enum.map(result.rows, fn [id] -> id end)
      end)

    # Generate order items for all orders
    order_items_data =
      Enum.flat_map(order_ids, fn order_id ->
        item_count = :rand.uniform(5)
        for _ <- 1..item_count do
          product_id = :rand.uniform(product_count)
          quantity = :rand.uniform(10)
          unit_price = :rand.uniform(10000) / 100
          {order_id, product_id, quantity, unit_price}
        end
      end)

    # Batch insert order items
    order_items_data
    |> Enum.chunk_every(batch_size)
    |> Enum.each(fn batch ->
      values =
        Enum.map_join(batch, ", ", fn {order_id, product_id, quantity, unit_price} ->
          "(#{order_id}, #{product_id}, #{quantity}, #{unit_price})"
        end)

      Postgrex.query!(conn,
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES #{values}",
        []
      )
    end)
  end

  defp seed_tenants(conn, count) do
    batch_size = 50

    1..count
    |> Enum.chunk_every(batch_size)
    |> Enum.flat_map(fn batch ->
      values =
        Enum.map_join(batch, ", ", fn i ->
          settings = Jason.encode!(%{plan: Enum.random(["free", "pro", "enterprise"]), features: []})
          "('Tenant #{i}', 'tenant-#{i}', '#{settings}'::jsonb)"
        end)

      {:ok, result} =
        Postgrex.query(conn,
          "INSERT INTO tenants (name, slug, settings) VALUES #{values} RETURNING id",
          []
        )

      Enum.map(result.rows, fn [id] -> uuid_to_string(id) end)
    end)
  end

  defp seed_accounts(conn, tenant_id, count) do
    batch_size = 50

    1..count
    |> Enum.chunk_every(batch_size)
    |> Enum.flat_map(fn batch ->
      values =
        Enum.map_join(batch, ", ", fn i ->
          role = if i == 1, do: "admin", else: Enum.random(["user", "editor", "viewer"])
          profile = Jason.encode!(%{name: "User #{i}", avatar: nil})
          "('#{tenant_id}', 'user#{i}@tenant.local', 'encrypted_#{i}', '#{role}', '#{profile}'::jsonb)"
        end)

      {:ok, result} =
        Postgrex.query(conn,
          "INSERT INTO accounts (tenant_id, email, encrypted_password, role, profile) VALUES #{values} RETURNING id",
          []
        )

      Enum.map(result.rows, fn [id] -> uuid_to_string(id) end)
    end)
  end

  defp seed_resources(conn, tenant_id, count) do
    types = ["document", "image", "config", "template", "report"]
    batch_size = 50

    1..count
    |> Enum.chunk_every(batch_size)
    |> Enum.flat_map(fn batch ->
      values =
        Enum.map_join(batch, ", ", fn i ->
          type = Enum.random(types)
          data = Jason.encode!(%{content: "Resource content #{i}", size: :rand.uniform(10000)})
          metadata = Jason.encode!(%{tags: ["tag#{:rand.uniform(10)}"], priority: :rand.uniform(5)})
          "('#{tenant_id}', '#{type}', 'Resource #{i}', '#{data}'::jsonb, '#{metadata}'::jsonb)"
        end)

      {:ok, result} =
        Postgrex.query(conn,
          "INSERT INTO resources (tenant_id, type, name, data, metadata) VALUES #{values} RETURNING id",
          []
        )

      Enum.map(result.rows, fn [id] -> uuid_to_string(id) end)
    end)
  end

  defp seed_events(conn, tenant_id, resource_ids, account_ids, count) do
    event_types = ["created", "updated", "deleted", "viewed", "shared", "exported"]
    batch_size = 100

    1..count
    |> Enum.chunk_every(batch_size)
    |> Enum.each(fn batch ->
      values =
        Enum.map_join(batch, ", ", fn _ ->
          event_type = Enum.random(event_types)
          resource_id = if length(resource_ids) > 0, do: "'#{Enum.random(resource_ids)}'", else: "NULL"
          actor_id = if length(account_ids) > 0, do: "'#{Enum.random(account_ids)}'", else: "NULL"
          payload = Jason.encode!(%{action: event_type, details: %{}})
          "('#{tenant_id}', #{resource_id}, '#{event_type}', '#{payload}'::jsonb, #{actor_id})"
        end)

      Postgrex.query!(conn,
        "INSERT INTO events (tenant_id, resource_id, event_type, payload, actor_id) VALUES #{values}",
        []
      )
    end)
  end
end
