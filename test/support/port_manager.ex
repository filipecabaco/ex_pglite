defmodule Pglite.Test.PortManager do
  @moduledoc """
  Manages unique TCP ports for tests using ETS to ensure no port collisions.

  Ports are checked out at the start of a test and checked in at the end,
  allowing reuse across tests while preventing concurrent usage.
  """

  @table :pglite_test_ports
  @port_range 50000..59999

  def start do
    if :ets.whereis(@table) == :undefined do
      :ets.new(@table, [:set, :public, :named_table])
    end

    :ok
  end

  def checkout do
    start()
    do_checkout(Enum.random(@port_range), 0)
  end

  defp do_checkout(_port, attempts) when attempts > 100 do
    raise "Could not find available port after 100 attempts"
  end

  defp do_checkout(port, attempts) do
    case :ets.insert_new(@table, {port, self()}) do
      true -> port
      false -> do_checkout(Enum.random(@port_range), attempts + 1)
    end
  end

  def checkin(port) do
    :ets.delete(@table, port)
    :ok
  end

  def checkout_multiple(count) when count > 0 do
    Enum.map(1..count, fn _ -> checkout() end)
  end

  def checkin_multiple(ports) when is_list(ports) do
    Enum.each(ports, &checkin/1)
  end
end
