mod config;
mod error;
mod images;

pub use config::AppConfig;
use tower_http::trace::TraceLayer;

use crate::infra::db;
use axum::{
    Router,
    extract::{DefaultBodyLimit, FromRef},
    routing,
};
use object_store::{ObjectStore, local::LocalFileSystem};
use sqlx::PgPool;
use std::{fs, path::PathBuf, sync::Arc};

#[derive(Clone)]
pub struct AppState {
    image_store: Arc<dyn ObjectStore>,
    db: PgPool,
}

impl FromRef<AppState> for Arc<dyn ObjectStore> {
    fn from_ref(state: &AppState) -> Arc<dyn ObjectStore> {
        state.image_store.clone()
    }
}

impl FromRef<AppState> for PgPool {
    fn from_ref(state: &AppState) -> PgPool {
        state.db.clone()
    }
}

fn create_router(app_state: AppState) -> Router {
    Router::new()
        .route("/ping", routing::get(ping_handler))
        .route(
            "/images/upload",
            routing::post(images::images_upload_handler),
        )
        .route_layer(DefaultBodyLimit::max(100 * 1024 * 1024)) // 100MB
        .with_state(app_state)
        .layer(TraceLayer::new_for_http())
}

impl AppConfig {
    pub async fn run(self) {
        let listener = tokio::net::TcpListener::bind(&self.address)
            .await
            .expect(&format!("Failed to bind address: {}", self.address));

        let image_storage_path = PathBuf::from(&self.image_storage_path);
        fs::create_dir_all(&image_storage_path).expect(&format!(
            "Failed to create image storage directory: {}",
            image_storage_path.display()
        ));
        let image_store = LocalFileSystem::new_with_prefix(image_storage_path)
            .expect("Failed to create image storage");
        let image_store = Arc::new(image_store);

        let db = db::create_pool(&self.database_url).await.expect(&format!(
            "Failed to create database pool: {}",
            self.database_url
        ));

        let router = create_router(AppState { image_store, db });

        tracing::info!("Running server on {}", self.address);
        axum::serve(listener, router).await.unwrap();
        tracing::info!("Server stopped");
    }
}

async fn ping_handler() -> &'static str {
    "pong"
}
