# Ecto Integration Example

Example showing how to use PGLite with Ecto ORM.

Note: PGLite requires pool_size of 1 and migration_lock set to false.

## Setup

```bash
mix deps.get
```

## Running

```bash
mix run --no-halt -e "EctoIntegration.run()"
```

## What it demonstrates

- Configuring Ecto with PGLite
- Running migrations
- Creating and querying data with Ecto schemas
- Using Ecto changesets and validations
