defmodule EctoIntegrationTest do
  use ExUnit.Case
  doctest EctoIntegration

  test "greets the world" do
    assert EctoIntegration.hello() == :world
  end
end
