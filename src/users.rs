use crate::auth::AuthUser;
use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use serde_json::json;
use sqlx::postgres::PgPool;

pub async fn get_own_profile_handler(
    State(db): State<PgPool>,
    AuthUser { user_id }: AuthUser,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let user = sqlx::query!(
        r#"SELECT id, name, email FROM "user" WHERE id = $1"#,
        user_id
    )
    .fetch_optional(&db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to fetch user");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "User not found".to_string()))?;

    let json = json!({
        "user": {
            "id": user.id.to_string(),
            "name": user.name,
            "email": user.email,
        }
    });

    Ok(Json(json))
}
