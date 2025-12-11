# Moments Aura

## Prerequisites

1. PostgresQL
2. sqlx-cli

## Run

To run this project, you need to start a postgres database.

1. Edit `config.toml`.
2. Run `sqlx database create` to create the database if it doesn't exist.
3. Run `sqlx migrate run` to migrate the database.
4. Run `RUST_LOG=info cargo run` to start the server.
