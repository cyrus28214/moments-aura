# Moments Aura

## Prerequisites

1. PostgresQL
2. sqlx-cli

## Development

1. Start a postgres database.
2. Run `cargo sqlx database create` to create the database if it doesn't exist.
3. Run `cargo sqlx migrate run` to migrate the database.
4. Edit `config.toml`.
5. Run `RUST_LOG=info cargo run` to start the server.
