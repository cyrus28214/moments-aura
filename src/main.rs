mod app;
mod config;
mod db;
use std::path::Path;
use tracing::{info, warn};
use tracing_subscriber::{EnvFilter, FmtSubscriber};

#[tokio::main]
async fn main() {
    // logger
    let filter = EnvFilter::new("info");
    let subscriber = FmtSubscriber::builder().with_env_filter(filter).finish();
    tracing::subscriber::set_global_default(subscriber).expect("Failed to set subscriber");

    // environment variables
    match dotenvy::dotenv() {
        Ok(_) => {
            info!("Loaded environment variables from .env");
        }
        Err(e) => {
            warn!("Failed to load environment variables from .env: {}. Continuing without .env.", e);
        }
    }

    // config
    let config_path = Path::new("config.toml");
    let config = config::AppConfig::from_toml_file(config_path);
    let app = app::App::new(config).await;
    app.run().await;
}
