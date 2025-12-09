use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;
use tracing::info;

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    info!("Connecting to database: {}", database_url);

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(5))
        .connect(database_url)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    info!("Database connection migrations applied successfully");

    Ok(pool)
}
