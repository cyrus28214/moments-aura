use crate::config::AppConfig;

use axum::{Router, routing::get, serve::Listener};
use tracing::info;
pub struct App<L: Listener> {
    router: Router,
    listener: L,
}

impl App<tokio::net::TcpListener> {
    pub async fn new(config: AppConfig) -> Self {
        let router = Router::new().route("/", get(|| async { "Hello, World!" }));
        let listener = tokio::net::TcpListener::bind(config.address).await.unwrap();
        Self { router, listener }
    }

    pub async fn run(self) {
        info!("Running server on {}", self.listener.local_addr().unwrap());
        axum::serve(self.listener, self.router).await.unwrap();
        info!("Server stopped");
    }
}
