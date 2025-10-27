use std::sync::Arc;
use std::{fs, path::PathBuf};

use crate::config::AppConfig;
use axum::Json;
use axum::{
    Router,
    body::Bytes,
    extract::{Multipart, State},
    routing::{get, post},
};
use object_store::{ObjectStore, local::LocalFileSystem, path::Path as ObjectStorePath};
use serde_json::json;
use tracing::info;

pub struct App {
    router: Router,
    listener: tokio::net::TcpListener,
}

impl App {
    pub async fn new(config: AppConfig) -> Self {
        let listener = tokio::net::TcpListener::bind(config.address).await.unwrap();
        let image_storage_path = PathBuf::from(&config.image_storage_path);
        fs::create_dir_all(&image_storage_path).unwrap();

        let image_storage = LocalFileSystem::new_with_prefix(image_storage_path).unwrap();
        let image_storage = Arc::new(image_storage);

        let router = Router::new()
            .route("/ping", get(ping_handler))
            .route("/photos/upload", post(upload_handler))
            .with_state(image_storage.clone());

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
    State(storage): State<Arc<LocalFileSystem>>,
    mut multipart: Multipart,
) -> String {
    while let Some(field) = multipart.next_field().await.unwrap() {
        if let Some(filename) = field.file_name() {
            let filename = filename.to_string();
            info!("Receiving file: {}", filename);
            let data: Bytes = field.bytes().await.unwrap();
            let store_path = ObjectStorePath::from(filename.clone());

            storage.put(&store_path, data.into()).await.unwrap();

            info!("File '{}' saved.", filename);
            return format!("File '{}' uploaded successfully.", filename);
        }
    }
    "No file was uploaded.".to_string()
}
