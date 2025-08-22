# Clean up leftover test directories before running tests
defmodule TestCleanup do
  def cleanup_leftover_test_dirs do
    case File.ls("tmp") do
      {:ok, files} ->
        files
        |> Enum.filter(&String.starts_with?(&1, "pglite_test_"))
        |> Enum.each(fn dir ->
          path = Path.join("tmp", dir)
          File.rm_rf(path)
        end)

      {:error, _} ->
        :ok
    end
  end
end

# Clean up leftover test directories before starting tests
TestCleanup.cleanup_leftover_test_dirs()
System.cmd("pkill", ["-f", "bun.*pglite_socket_server"])

ExUnit.start(capture_log: true)
