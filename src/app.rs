mod photos;

use std::collections::HashMap;
use std::env;
use std::sync::Arc;
use std::{fs, path::PathBuf};

use crate::config::AppConfig;
use crate::db;

use axum::extract::FromRef;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use axum::{
    Router,
    routing::{get, post},
};

use object_store::local::LocalFileSystem;
use sqlx::PgPool;
use tracing::info;

#[derive(Clone)]
pub struct AppState {
    image_store: Arc<LocalFileSystem>,
    db: PgPool,
}

impl FromRef<AppState> for Arc<LocalFileSystem> {
    fn from_ref(state: &AppState) -> Arc<LocalFileSystem> {
        state.image_store.clone()
    }
}

impl FromRef<AppState> for PgPool {
    fn from_ref(state: &AppState) -> PgPool {
        state.db.clone()
    }
}

pub struct App {
    router: Router,
    listener: tokio::net::TcpListener,
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
        let image_store = Arc::new(image_store);

        // router
        let router = Router::new()
            .route("/ping", get(ping_handler))
            .route("/photos/upload", post(photos::photos_upload_handler))
            .with_state(AppState { image_store, db });
        Self { router, listener }
    }

    pub async fn run(self) {
        info!("Running server on {}", self.listener.local_addr().unwrap());
        axum::serve(self.listener, self.router).await.unwrap();
        info!("Server stopped");
    }
}

async fn ping_handler() -> impl IntoResponse {
    (StatusCode::OK, Json("pong"))
}