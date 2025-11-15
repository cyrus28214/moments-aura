use axum::{
    Json,
    extract::State, http::{header, HeaderMap}, response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use validator::{Validate, ValidationErrors};
use crate::app::error::AppError;
mod jwt;
pub use jwt::JwtService;

#[derive(Deserialize, Validate)]
pub struct AuthRegisterPayload {
    #[validate(length(min = 6, max = 256))]
    name: String,
    #[validate(email)]
    email: String,
    #[validate(length(min = 6, max = 256))]
    password: String,
}

impl From<ValidationErrors> for AppError {
    fn from(error: ValidationErrors) -> Self {
        AppError::BadRequest(error.to_string())
    }
}

#[derive(Serialize)]
struct User {
    id: i32,
    name: String,
    email: String
}

#[derive(Serialize)]
pub struct AuthRegisterResult {
    user: User,
}

/**
 * Register a new user
 * 
 * 1. 用户名、密码要求6个字节以上，256个字节以内
 * 2. email 为合法的邮箱地址
 * 3. 如果用户名或邮箱已存在，则返回错误
 */
pub async fn auth_register_handler(
    State(db): State<PgPool>,
    State(jwt_service): State<JwtService>,
    Json(payload): Json<AuthRegisterPayload>,
) -> Result<impl IntoResponse, AppError> {
    payload.validate()?;

    let user = sqlx::query!(
        r#"SELECT id FROM "user" WHERE name = $1"#,
        payload.name
    )
    .fetch_optional(&db)
    .await
    .map_err(|e| AppError::InternalServerError(e.to_string()))?;

    if user.is_some() {
        return Err(AppError::BadRequest("User name already registered".to_string()));
    }

    let user = sqlx::query!(
        r#"SELECT id FROM "user" WHERE email = $1"#,
        payload.email
    )
    .fetch_optional(&db)
    .await
    .map_err(|e| AppError::InternalServerError(e.to_string()))?;

    if user.is_some() {
        return Err(AppError::BadRequest("Email already registered".to_string()));
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
    .map_err(|e| AppError::InternalServerError(e.to_string()))?;
    
    let user_id = user.id.to_string();

    let token = jwt_service.generate_token(user_id).expect("Failed to generate token");

    let cookie_str = format!("token={}; Path=/; HttpOnly; Secure; SameSite=Strict", token);

    let result = AuthRegisterResult {
        user,
    };

    Ok(([(header::SET_COOKIE, cookie_str)], Json(result)))
}

#[derive(Deserialize, Validate)]
pub struct AuthLoginPayload {
    #[validate(email)]
    email: String,
    #[validate(length(min = 6, max = 256))]
    password: String,
}

#[derive(Serialize)]
pub struct AuthLoginResult {
    user: User,
}

pub async fn auth_login_handler(
    State(db): State<PgPool>,
    State(jwt_service): State<JwtService>,
    Json(payload): Json<AuthLoginPayload>,
) -> Result<impl IntoResponse, AppError> {
    payload.validate()?;

    let user = sqlx::query_as!(
        User,
        r#"SELECT id, name, email FROM "user" WHERE email = $1 AND password = $2"#,
        payload.email,
        payload.password
    )
    .fetch_optional(&db)
    .await
    .map_err(|e| AppError::InternalServerError(e.to_string()))?
    .ok_or(AppError::BadRequest("Invalid email or password".to_string()))?;

    let user_id = user.id.to_string();

    let token = jwt_service.generate_token(user_id).expect("Failed to generate token");

    let cookie_str = format!("token={}; Path=/; HttpOnly; Secure; SameSite=Strict", token);

    let result = AuthLoginResult {
        user,
    };

    Ok(([(header::SET_COOKIE, cookie_str)], Json(result)))
}

#[derive(Serialize)]
pub struct AuthMeResult {
    user: User,
}

/**
 * Get current authenticated user information
 * 
 * 1. Extract token from cookie
 * 2. Verify token and get user_id
 * 3. Query user from database
 * 4. Return user information
 */
pub async fn auth_me_handler(
    State(db): State<PgPool>,
    State(jwt_service): State<JwtService>,
    headers: HeaderMap,
) -> Result<impl IntoResponse, AppError> {
    let cookie_header = headers.get(header::COOKIE)
        .ok_or_else(|| AppError::BadRequest("Cookie not found".to_string()))?
        .to_str()
        .map_err(|_| AppError::BadRequest("Invalid cookie header".to_string()))?;

    let token = cookie_header
        .split(';')
        .find_map(|cookie| {
            let cookie = cookie.trim();
            if cookie.starts_with("token=") {
                Some(cookie[6..].to_string())
            } else {
                None
            }
        })
        .ok_or_else(|| AppError::BadRequest("Token not found in cookie".to_string()))?;

    let claims = jwt_service.verify_token(&token)
        .map_err(|_| AppError::BadRequest("Invalid token".to_string()))?;

    let user_id: i32 = claims.sub.parse()
        .map_err(|_| AppError::BadRequest("Invalid user ID in token".to_string()))?;

    let user = sqlx::query_as!(
        User,
        r#"SELECT id, name, email FROM "user" WHERE id = $1"#,
        user_id
    )
    .fetch_optional(&db)
    .await
    .map_err(|e| AppError::InternalServerError(e.to_string()))?
    .ok_or_else(|| AppError::BadRequest("User not found".to_string()))?;

    let result = AuthMeResult {
        user,
    };

    Ok(Json(result))
}