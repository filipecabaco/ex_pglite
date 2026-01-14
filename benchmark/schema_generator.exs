defmodule Benchmark.SchemaGenerator do
  @moduledoc """
  Generates database schemas for benchmarking.
  Supports simple, complex, and realistic PostgreSQL schemas.
  """

  def generate_schema(:simple) do
    """
    CREATE TABLE IF NOT EXISTS benchmark_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      value INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_benchmark_items_name ON benchmark_items(name);
    CREATE INDEX IF NOT EXISTS idx_benchmark_items_value ON benchmark_items(value);
    """
  end

  def generate_schema(:complex) do
    """
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(100) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      parent_id INTEGER REFERENCES categories(id),
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      stock_quantity INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      total_amount DECIMAL(10, 2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    """
  end

  def generate_schema(:realistic) do
    """
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      encrypted_password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      profile JSONB DEFAULT '{}',
      last_login_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(tenant_id, email)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      user_agent TEXT,
      ip_address INET,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS resources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      type VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      data JSONB NOT NULL DEFAULT '{}',
      metadata JSONB DEFAULT '{}',
      version INTEGER DEFAULT 1,
      is_deleted BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
      event_type VARCHAR(100) NOT NULL,
      payload JSONB NOT NULL,
      actor_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
      occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(100),
      resource_id UUID,
      old_value JSONB,
      new_value JSONB,
      ip_address INET,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_tenant ON accounts(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_resources_tenant ON resources(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
    CREATE INDEX IF NOT EXISTS idx_resources_tenant_type ON resources(tenant_id, type) WHERE NOT is_deleted;
    CREATE INDEX IF NOT EXISTS idx_events_tenant ON events(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_events_resource ON events(resource_id);
    CREATE INDEX IF NOT EXISTS idx_events_occurred ON events(occurred_at);
    CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_audit_account ON audit_logs(account_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    """
  end

  def table_names(:simple), do: ["benchmark_items"]
  def table_names(:complex), do: ["users", "categories", "products", "orders", "order_items"]
  def table_names(:realistic), do: ["tenants", "accounts", "sessions", "resources", "events", "audit_logs"]
end
