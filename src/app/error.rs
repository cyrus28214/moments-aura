use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Failed to parse body: {0}")]
    BodyParseFailed(String),
    #[error("Bad request: {0}")]
    BadRequest(String),
    #[error("Internal server error: {0}")]
    InternalServerError(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            Self::BodyParseFailed(e) => {
                tracing::warn!(error = ?e, "{}", e);
                (StatusCode::BAD_REQUEST, e).into_response()
            }
            Self::BadRequest(e) => {
                tracing::warn!(error = ?e, "{}", e);
                (StatusCode::BAD_REQUEST, e).into_response()
            }
            Self::InternalServerError(e) => {
                tracing::error!(error = ?e, "{}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, e).into_response()
            }
        }
    }
}
