defmodule TransactionsTest do
  use ExUnit.Case
  doctest Transactions

  test "greets the world" do
    assert Transactions.hello() == :world
  end
end
