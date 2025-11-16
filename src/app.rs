mod config;
mod error;
mod images;
mod auth;

pub use config::AppConfig;
use tower_http::trace::TraceLayer;

use crate::infra::db;
use crate::app::auth::JwtService;
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
    jwt_service: JwtService,
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

impl FromRef<AppState> for JwtService {
    fn from_ref(state: &AppState) -> JwtService {
        state.jwt_service.clone()
    }
}

fn create_router(app_state: AppState) -> Router {
    Router::new()
        .route("/ping", routing::get(ping_handler))
        .route(
            "/images/upload",
            routing::post(images::images_upload_handler),
        )
        .route("/images/list", routing::get(images::images_list_handler))
        .route(
            "/images/{id}/content",
            routing::get(images::images_get_content_handler),
        )
        .route(
            "/images/delete-batch",
            routing::post(images::images_delete_batch_handler),
        )
        .route("/auth/register", routing::post(auth::auth_register_handler))
        .route("/auth/login", routing::post(auth::auth_login_handler))
        .route("/auth/me", routing::get(auth::auth_me_handler))
        .route_layer(DefaultBodyLimit::max(100 * 1024 * 1024)) // 100MB
        .with_state(app_state)
        .layer(TraceLayer::new_for_http())
}

impl AppConfig {
    pub async fn run(self) {
        let listener = tokio::net::TcpListener::bind(&self.address)
            .await
            .expect(&format!("Failed to bind address: {}", self.address));

        let storage_dir = PathBuf::from(&self.storage_dir);
        fs::create_dir_all(&storage_dir).expect(&format!(
            "Failed to create store directory: {}",
            storage_dir.display()
        ));
        let store = LocalFileSystem::new_with_prefix(storage_dir).expect("Failed to create store");
        let store = Arc::new(store);

        let db = db::create_pool(&self.database_url).await.expect(&format!(
            "Failed to create database pool: {}",
            self.database_url
        ));

        let jwt_service = JwtService::new(self.jwt_secret.as_bytes().to_vec());

        let router = create_router(AppState {
            store,
            db: db.clone(),
            jwt_service,
        });

        tracing::info!("Running server on {}", self.address);
        axum::serve(listener, router).await.unwrap();
        tracing::info!("Server stopped");

        db.close().await;
    }
}

async fn ping_handler() -> &'static str {
    "pong"
}
