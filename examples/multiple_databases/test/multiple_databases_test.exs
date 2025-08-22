defmodule MultipleDatabasesTest do
  use ExUnit.Case
  doctest MultipleDatabases

  test "greets the world" do
    assert MultipleDatabases.hello() == :world
  end
end
