use crate::config::AppConfig;
use crate::object_storage::ObjectStorage;
use std::path::PathBuf;

use axum::{
    Router,
    extract::Multipart,
    routing::{get, post},
    serve::Listener,
};
use tracing::info;
pub struct App<L: Listener, S: ObjectStorage> {
    router: Router,
    listener: L,
    image_storage: S,
}

impl App<tokio::net::TcpListener, ObjectStorage> {
    pub async fn new(config: AppConfig) -> Self {
        let router = Router::new().route("/", get(|| async { "Hello, World!" }));
        let listener = tokio::net::TcpListener::bind(config.address).await.unwrap();
        let image_storage = ObjectStorage::new(PathBuf::from(&config.image_storage_path)).await;
        Self {
            router,
            listener,
            image_storage,
        }
    }

    pub async fn upload_image(mut multipart: Multipart) {}

    pub async fn run(self) {
        info!("Running server on {}", self.listener.local_addr().unwrap());
        axum::serve(self.listener, self.router).await.unwrap();
        info!("Server stopped");
    }
}
