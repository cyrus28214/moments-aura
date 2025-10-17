use serde::Deserialize;
use std::path::Path;
use tracing::info;
fn default_address() -> String {
    let default = "0.0.0.0:8080".to_string();
    info!("Using default address: {}", default);
    return default;
}

fn default_image_storage_path() -> String {
    let default = "images".to_string();
    info!("Using default image storage path: {}", default);
    return default;
}

#[derive(Deserialize)]
pub struct AppConfig {
    #[serde(default = "default_address")]
    pub address: String,
    #[serde(default = "default_image_storage_path")]
    pub image_storage_path: String,
}

impl AppConfig {
    pub fn from_toml_file(path: &Path) -> Self {
        let config = std::fs::read_to_string(path).unwrap();
        toml::from_str(&config).unwrap()
    }
}
