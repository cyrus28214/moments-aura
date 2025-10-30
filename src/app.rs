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
    store: Arc<dyn ObjectStore>,
    db: PgPool,
}

impl FromRef<AppState> for Arc<dyn ObjectStore> {
    fn from_ref(state: &AppState) -> Arc<dyn ObjectStore> {
        state.store.clone()
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

        let store_path = PathBuf::from(&self.store_path);
        fs::create_dir_all(&store_path).expect(&format!(
            "Failed to create store directory: {}",
            store_path.display()
        ));
        let store = LocalFileSystem::new_with_prefix(store_path).expect("Failed to create store");
        let store = Arc::new(store);

        let db = db::create_pool(&self.database_url).await.expect(&format!(
            "Failed to create database pool: {}",
            self.database_url
        ));

        let router = create_router(AppState { store, db });

        tracing::info!("Running server on {}", self.address);
        axum::serve(listener, router).await.unwrap();
        tracing::info!("Server stopped");
    }
}

async fn ping_handler() -> &'static str {
    "pong"
}
