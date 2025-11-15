use serde::Deserialize;
use std::{collections::HashMap, env, path::Path};

pub struct AppConfig {
    pub address: String,
    pub storage_dir: String,
    pub database_url: String,
    pub jwt_secret: String,
}

#[derive(Deserialize)]
pub struct AppConfigToml {
    pub address: Option<String>,
    pub storage_dir: Option<String>,
    pub static_url: Option<String>,
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

        let storage_dir = toml_config.storage_dir.unwrap_or_else(|| {
            tracing::warn!(
                "No storage directory provided in config file, using default \"./data\""
            );
            String::from("./data")
        });

        let database_url = env_vars
            .get("DATABASE_URL")
            .expect("DATABASE_URL is not set")
            .clone();

        let jwt_secret = env_vars
            .get("JWT_SECRET")
            .expect("JWT_SECRET is not set, hint: you can use `openssl rand -hex 32` to generate a secret")
            .clone();

        Self {
            address,
            storage_dir,
            database_url,
            jwt_secret,
        }
    }
}
