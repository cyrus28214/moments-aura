mod app;
mod infra;
use std::path::Path;
use tracing::{info, warn};
use tracing_subscriber::{EnvFilter, FmtSubscriber};

#[tokio::main]
async fn main() {
    // logger
    let filter = EnvFilter::new("info");
    let subscriber = FmtSubscriber::builder().with_env_filter(filter).finish();
    tracing::subscriber::set_global_default(subscriber).expect("Failed to set subscriber");
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
