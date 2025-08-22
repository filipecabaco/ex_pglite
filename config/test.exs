import Config

config :pglite,
  env: :test,
  priv_dir: File.cwd!() <> "/priv",
  timeout: 10_000,
  socket_base_dir: "tmp/test_sockets",
  bun_executable_path: "/Users/filipecabaco/.local/share/mise/installs/bun/1.1.30/bin/bun"
