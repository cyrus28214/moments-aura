# Moments Aura

## Prerequisites

1. PostgresQL
2. sqlx-cli

## Run

To run this project, you need to start a postgres database.

Create and edit `.env`

```bash
# make sure this user exists
DATABASE_URL=postgres://your_user:your_password@localhost:5432/your_db
```

Run `sqlx database create` to create the database if it doesn't exist.

Run `sqlx migrate run` to migrate the database.
