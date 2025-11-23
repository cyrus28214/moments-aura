use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json
};
use sqlx::postgres::PgPool;
use crate::app::auth::AuthUser;
use serde::Serialize;
use serde_json::json;

#[derive(Serialize)]
pub struct User {
    id: i32,
    name: String,
    email: String
}

pub async fn get_own_profile_handler(
    State(db): State<PgPool>,
    AuthUser{ user_id }: AuthUser
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let user = sqlx::query_as!(
        User,
        r#"SELECT id, name, email FROM "user" WHERE id = $1"#,
        user_id
    )
    .fetch_optional(&db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to fetch user");
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
    })?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "User not found".to_string()))?;

    let json = json!({
        "user": user
    });

    Ok(Json(json))
}