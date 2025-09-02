# Multiple Databases Example

Example demonstrating how to run multiple PGLite instances simultaneously and join data across them.

## Setup

```bash
mix deps.get
```

## Running

```bash
mix run -e "MultipleDatabases.run()"
```

## What it demonstrates

- Creating multiple PGLite instances
- Managing separate in-memory databases
- Cross-database data operations
- Resource management for multiple instances
