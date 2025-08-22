# EctoIntegration

> !note Due to the way PGLite works, we need to enforce a pool_size of 1 and no migration_lock can be enforced so that migrations can work.

This is a simple example of how to use PGLite with Ecto.

## Running the example

```bash
mix run --no-halt -e "EctoIntegration.run()"
```
