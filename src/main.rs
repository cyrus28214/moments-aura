use moments_aura::{
    ai, auth, config,
    infra::{self, storage::LocalStorage},
    photos, tags, users,
};
use reverse_geocoder::ReverseGeocoder;
use std::{path::Path, sync::Arc};
use tower_http::trace::TraceLayer;
use tracing::{info, warn};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use axum::{
    Router,
    extract::{DefaultBodyLimit, FromRef, State},
    routing,
};
use sqlx::PgPool;
use std::{fs, path::PathBuf};

#[derive(Clone)]
pub struct AppState {
    storage: LocalStorage,
    db: PgPool,
    jwt_service: auth::JwtService,
    geocoder: Arc<ReverseGeocoder>,
    ai_service: Option<Arc<ai::AiService>>,
}

impl FromRef<AppState> for LocalStorage {
    fn from_ref(state: &AppState) -> LocalStorage {
        state.storage.clone()
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

impl FromRef<AppState> for Arc<ReverseGeocoder> {
    fn from_ref(state: &AppState) -> Arc<ReverseGeocoder> {
        state.geocoder.clone()
    }
}

impl FromRef<AppState> for Arc<ai::AiService> {
    fn from_ref(state: &AppState) -> Arc<ai::AiService> {
        state.ai_service.clone().expect("AI service is not enabled")
    }
}

async fn server_info_handler(State(state): State<AppState>) -> axum::Json<serde_json::Value> {
    let mut features = vec![];
    if state.ai_service.is_some() {
        features.push("ai");
    }
    axum::Json(serde_json::json!({
        "features": features
    }))
}

fn create_router(app_state: AppState) -> Router {
    let mut router = Router::new()
        .route("/server-info", routing::get(server_info_handler))
        .route("/photos/upload", routing::post(photos::upload_handler))
        .route("/photos/list", routing::get(photos::list_handler))
        .route("/tags/list", routing::get(tags::list_tags_handler))
        .route(
            "/photos/{photo_id}/content",
            routing::get(photos::get_content_handler),
        );

    if app_state.ai_service.is_some() {
        router = router.route(
            "/photos/{photo_id}/recommend-tags",
            routing::post(photos::recommend_tags_handler),
        );
    }

    router
        .route(
            "/photos/delete-batch",
            routing::post(photos::delete_batch_handler),
        )
        .route(
            "/tags/add-batch",
            routing::post(photos::add_tags_batch_handler),
        )
        .route(
            "/tags/delete-batch",
            routing::post(photos::delete_tags_batch_handler),
        )
        .route("/auth/register", routing::post(auth::register_handler))
        .route("/auth/login", routing::post(auth::login_handler))
        .route("/users/me", routing::get(users::get_own_profile_handler))
        .route_layer(DefaultBodyLimit::max(100 * 1024 * 1024)) // 100MB
        .with_state(app_state)
        .layer(TraceLayer::new_for_http())
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

    // app
    let config_path = Path::new("config.toml");
    let app_config = config::AppConfig::new(config_path);
    let listener = tokio::net::TcpListener::bind(&app_config.address)
        .await
        .expect(&format!("Failed to bind address: {}", app_config.address));

    let storage_dir = PathBuf::from(&app_config.storage_dir);
    fs::create_dir_all(&storage_dir).expect(&format!(
        "Failed to create store directory: {}",
        storage_dir.display()
    ));
    let storage = LocalStorage::new(storage_dir);

    let db = infra::db::create_pool(&app_config.database_url)
        .await
        .expect(&format!(
            "Failed to create database pool: {}",
            app_config.database_url
        ));

    let jwt_service = auth::JwtService::new(app_config.jwt_secret.as_bytes());

    let ai_service = if app_config.ai.enable {
        Some(Arc::new(ai::AiService::new(app_config.ai)))
    } else {
        None
    };

    let router = create_router(AppState {
        storage,
        db: db.clone(),
        jwt_service,
        geocoder: Arc::new(ReverseGeocoder::new()),
        ai_service,
    });

    tracing::info!("Running server on {}", &app_config.address);
    axum::serve(listener, router).await.unwrap();
    tracing::info!("Server stopped");

    db.close().await;
}
