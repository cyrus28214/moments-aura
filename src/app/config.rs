use serde::Deserialize;
use std::{collections::HashMap, env, path::Path};

pub struct AppConfig {
    pub address: String,
    pub image_storage_path: String,
    pub database_url: String,
}

#[derive(Deserialize)]
pub struct AppConfigToml {
    pub address: Option<String>,
    pub image_storage_path: Option<String>,
}

impl AppConfig {
    pub fn from_file(toml_path: &Path) -> Self {
        Self::from_file_with_env_vars(toml_path, &env::vars().collect())
    }

    pub fn from_file_with_env_vars(toml_path: &Path, env_vars: &HashMap<String, String>) -> Self {
        tracing::info!("Loading config from file: {}", toml_path.display());

        let config = std::fs::read_to_string(toml_path).expect("Failed to read config file");
        let toml_config: AppConfigToml =
            toml::from_str(&config).expect("Failed to parse config file");

        let address = toml_config.address.unwrap_or_else(|| {
            tracing::warn!("No address provided in config file, using default \"0.0.0.0:8080\"");
            String::from("0.0.0.0:8080")
        });

        let image_storage_path = toml_config.image_storage_path.unwrap_or_else(|| {
            tracing::warn!(
                "No image storage path provided in config file, using default \"./images\""
            );
            String::from("./images")
        });

        let database_url = env_vars
            .get("DATABASE_URL")
            .expect("DATABASE_URL is not set")
            .clone();

        Self {
            address,
            image_storage_path,
            database_url,
        }
    }
}
