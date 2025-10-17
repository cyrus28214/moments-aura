use serde::Deserialize;
use std::path::Path;

#[derive(Deserialize)]
pub struct AppConfig {
    pub address: String,
}

impl AppConfig {
    pub fn from_toml_file(path: &Path) -> Self {
        let config = std::fs::read_to_string(path).unwrap();
        toml::from_str(&config).unwrap()
    }
}
