use std::collections::HashMap;
use std::env;
use std::sync::Arc;
use std::{fs, path::PathBuf};

use crate::config::AppConfig;
use crate::db;

use axum::{
    Json,
    Router,
    body::Bytes,
    extract::{Multipart, State},
    routing::{get, post},
};

use object_store::{ObjectStore, local::LocalFileSystem, path::Path as ObjectStorePath};
use serde_json::json;
use sqlx::PgPool;
use tracing::info;

pub struct App {
    router: Router,
    listener: tokio::net::TcpListener,
}

pub struct AppState {
    pub image_store: LocalFileSystem,
    pub db: PgPool,
}

impl App {
    pub async fn new(config: AppConfig) -> Self {
        let env_vars = env::vars().collect();
        Self::new_with_env_vars(config, &env_vars).await
    }

    pub async fn new_with_env_vars(config: AppConfig, env_vars: &HashMap<String, String>) -> Self {
        let listener = tokio::net::TcpListener::bind(config.address).await.unwrap();
        let image_storage_path = PathBuf::from(&config.image_storage_path);
        fs::create_dir_all(&image_storage_path).unwrap();

        // database
        let database_url = env_vars.get("DATABASE_URL").expect("DATABASE_URL is not set");
        let db = db::create_pool(database_url).await.expect("Failed to create database pool");
        
        // image storage
        let image_store = LocalFileSystem::new_with_prefix(image_storage_path)
            .expect("Failed to create image storage");

        // app state
        let app_state = AppState {
            image_store: image_store,
            db: db,
        };
        let app_state = Arc::new(app_state);

        // router
        let router = Router::new()
            .route("/ping", get(ping_handler))
            .route("/photos/upload", post(upload_handler))
            .with_state(app_state);

        Self { router, listener }
    }

    pub async fn run(self) {
        info!("Running server on {}", self.listener.local_addr().unwrap());
        axum::serve(self.listener, self.router).await.unwrap();
        info!("Server stopped");
    }
}

async fn ping_handler() -> Json<serde_json::Value> {
    Json(json!({
        "code": "OK",
        "data": "pong"
    }))
}

async fn upload_handler(
    State(state): State<Arc<AppState>>,
    mut multipart: Multipart,
) -> String {
    while let Some(field) = multipart.next_field().await.unwrap() {
        if let Some(filename) = field.file_name() {
            let filename = filename.to_string();
            info!("Receiving file: {}", filename);
            let data: Bytes = field.bytes().await.unwrap();
            let store_path = ObjectStorePath::from(filename.clone());

            state.image_store.put(&store_path, data.into()).await.unwrap();

            info!("File '{}' saved.", filename);
            return format!("File '{}' uploaded successfully.", filename);
        }
    }
    "No file was uploaded.".to_string()
}
