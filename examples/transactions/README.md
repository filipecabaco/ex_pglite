# Transactions Example

Example demonstrating transaction support in PGLite with Postgrex.

## Setup

```bash
mix deps.get
```

## Running

```bash
mix run -e "Transactions.run()"
```

## What it demonstrates

- Starting a PGLite instance
- Creating tables within transactions
- Rolling back failed transactions
- Committing successful transactions
- Querying data after transaction completion

