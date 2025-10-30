mod app;
mod infra;
use std::path::Path;
use tracing::{info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    // logger
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
    std::panic::set_hook(Box::new(tracing_panic::panic_hook));

    // environment variables
    match dotenvy::dotenv() {
        Ok(_) => info!("Loaded environment variables from .env"),
        Err(e) => warn!(
            "Could not load environment variables from .env: {}, continuing with system environment variables.",
            e
        ),
    }

    // app
    let config_path = Path::new("config.toml");
    app::AppConfig::from_file(config_path).run().await;
}
