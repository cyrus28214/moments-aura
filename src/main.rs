use moments_aura::{auth, config, db, images, users};
use std::path::Path;
use tower_http::trace::TraceLayer;
use tracing::{info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

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
    jwt_service: auth::JwtService,
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

impl FromRef<AppState> for auth::JwtService {
    fn from_ref(state: &AppState) -> auth::JwtService {
        state.jwt_service.clone()
    }
}

fn create_router(app_state: AppState) -> Router {
    Router::new()
        .route("/ping", routing::get(ping_handler))
        .route(
            "/images/upload",
            routing::post(images::upload_images_handler),
        )
        .route("/images/list", routing::get(images::list_images_handler))
        .route(
            "/images/{id}/content",
            routing::get(images::get_image_content_handler),
        )
        .route(
            "/images/delete-batch",
            routing::post(images::delete_images_handler),
        )
        .route("/auth/register", routing::post(auth::register_handler))
        .route("/auth/login", routing::post(auth::login_handler))
        .route("/users/me", routing::get(users::get_own_profile_handler))
        .route_layer(DefaultBodyLimit::max(100 * 1024 * 1024)) // 100MB
        .with_state(app_state)
        .layer(TraceLayer::new_for_http())
}

async fn ping_handler() -> &'static str {
    "pong"
}

#[tokio::main]
async fn main() {
    // logger
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
    std::panic::set_hook(Box::new(tracing_panic::panic_hook));

    // environment variables
    match dotenvy::dotenv() {
        Ok(_) => info!("Loaded environment variables from .env"),
        Err(e) => warn!(
            "Could not load environment variables from .env: {}, continuing with system environment variables.",
            e
        ),
    }

    // app
    let config_path = Path::new("config.toml");
    let app_config = config::AppConfig::from_file(config_path);
    let listener = tokio::net::TcpListener::bind(&app_config.address)
        .await
        .expect(&format!("Failed to bind address: {}", app_config.address));

    let storage_dir = PathBuf::from(&app_config.storage_dir);
    fs::create_dir_all(&storage_dir).expect(&format!(
        "Failed to create store directory: {}",
        storage_dir.display()
    ));
    let store = LocalFileSystem::new_with_prefix(storage_dir).expect("Failed to create store");
    let store = Arc::new(store);

    let db = db::create_pool(&app_config.database_url)
        .await
        .expect(&format!(
            "Failed to create database pool: {}",
            app_config.database_url
        ));

    let jwt_service = auth::JwtService::new(app_config.jwt_secret.as_bytes());

    let router = create_router(AppState {
        store,
        db: db.clone(),
        jwt_service,
    });

    tracing::info!("Running server on {}", &app_config.address);
    axum::serve(listener, router).await.unwrap();
    tracing::info!("Server stopped");

    db.close().await;
}
