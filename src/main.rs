mod app;
mod config;
mod object_storage;
use std::path::Path;
use tracing_subscriber::{EnvFilter, FmtSubscriber};

#[tokio::main]
async fn main() {
    let filter = EnvFilter::new("info");
    let subscriber = FmtSubscriber::builder().with_env_filter(filter).finish();
    tracing::subscriber::set_global_default(subscriber).expect("Failed to set subscriber");
    let config_path = Path::new("config.toml");
    let config = config::AppConfig::from_toml_file(config_path);
    let app = app::App::new(config).await;
    app.run().await;
}
