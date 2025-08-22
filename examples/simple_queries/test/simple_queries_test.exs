defmodule SimpleQueriesTest do
  use ExUnit.Case
  doctest SimpleQueries

  test "greets the world" do
    assert SimpleQueries.hello() == :world
  end
end
