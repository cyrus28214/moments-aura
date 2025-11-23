use axum::{
    Json, 
    extract::{State, FromRequestParts, FromRef},
    http::{request::Parts, header, StatusCode},
    response::{IntoResponse, Response}
};
use serde_json::json;
use crate::infra::crypto::JwtService;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use validator::Validate;

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: i32,
}

impl<S> FromRequestParts<S> for AuthUser
where S: Send + Sync, JwtService: FromRef<S> {
    type Rejection = (StatusCode, String);

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let token = parts.headers
            .get(header::AUTHORIZATION)
            .ok_or((StatusCode::UNAUTHORIZED, "Authorization header not found".to_string()))?
            .to_str()
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid authorization header".to_string()))?
            .strip_prefix("Bearer ")
            .ok_or((StatusCode::UNAUTHORIZED, "Invalid authorization format".to_string()))?
            .trim();

        let jwt_service = JwtService::from_ref(state);

        let user_id = jwt_service
            .verify(token)
            .map_err(|_| {
                tracing::warn!("Invalid token");
                (StatusCode::UNAUTHORIZED, "Invalid token".to_string())
            })?
            .sub.parse::<i32>()
            .map_err(|_| {
                tracing::warn!("Invalid user ID in token");
                (StatusCode::UNAUTHORIZED, "Invalid user ID in token".to_string())
            })?;

        Ok(AuthUser { user_id })
    }
}


#[derive(Deserialize, Validate)]
pub struct RegisterPayload {
    #[validate(length(min = 6, max = 256, message = "Name must be between 6 and 256 characters"))]
    name: String,
    #[validate(email(message = "Invalid email address"), length(max = 256, message = "Email must be less than 256 characters"))]
    email: String,
    #[validate(length(min = 6, max = 256, message = "Password must be between 6 and 256 characters"))]
    password: String,
}

#[derive(Serialize)]
pub struct User {
    id: i32,
    name: String,
    email: String,
}

pub async fn register_handler(
    State(db): State<PgPool>,
    State(jwt_service): State<JwtService>,
    Json(payload): Json<RegisterPayload>,
) -> Result<Response, (StatusCode, String)> {
    if let Err(e) = payload.validate() {
        let body = Json(json!({
            "details": e
        }));
        return Ok((StatusCode::BAD_REQUEST, body).into_response());
    }

    let user = sqlx::query!(
        r#"SELECT id FROM "user" WHERE name = $1 OR email = $2"#,
        payload.name,
        payload.email
    )
    .fetch_optional(&db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to fetch user");
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
    })?;

    if user.is_some() {
        return Err((StatusCode::CONFLICT, "User already exists".to_string()));
    }

    let user = sqlx::query_as!(
        User,
        r#"INSERT INTO "user" (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email"#,
        payload.name,
        payload.email,
        payload.password
    )
    .fetch_one(&db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to create user");
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
    })?;

    let user_id = user.id.to_string();

    let token = jwt_service
        .sign(user_id, time::Duration::days(2))
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to sign token");
            (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
        })?;

    Ok(Json(json!({
        "user": user,
        "token": token
    })).into_response())
}

#[derive(Deserialize, Validate)]
pub struct LoginPayload {
    email: String,
    password: String,
}

pub async fn login_handler(
    State(db): State<PgPool>,
    State(jwt_service): State<JwtService>,
    Json(payload): Json<LoginPayload>,
) -> Result<Response, (StatusCode, String)> {
    let user = sqlx::query_as!(
        User,
        r#"SELECT id, name, email FROM "user" WHERE email = $1 AND password = $2"#,
        payload.email,
        payload.password
    )
    .fetch_optional(&db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to fetch user");
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
    })?
    .ok_or((StatusCode::BAD_REQUEST, "Invalid email or password".to_string()))?;

    let user_id = user.id.to_string();

    let token = jwt_service
        .sign(user_id, time::Duration::days(2))
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to sign token");
            (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
        })?;

    Ok(Json(json!({
        "user": user,
        "token": token
    })).into_response())
}