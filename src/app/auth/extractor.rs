#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: Option<i32>,
}

use axum::{
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, header},
};
use crate::app::{error::AppError, auth::JwtService};

impl<S> FromRequestParts<S> for AuthUser
where S: Send + Sync, JwtService: FromRef<S> {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let token = match parts.headers.get(header::COOKIE) {
            Some(t) => t,
            None => return Ok(AuthUser { user_id: None }),
        };

        let token = match token.to_str() {
            Ok(t) => t,
            Err(_) => return Ok(AuthUser { user_id: None }),
        };

        let token = token.split(';').find_map(|cookie| {
            if cookie.starts_with("token=") {
                Some(cookie[6..].to_string())
            } else {
                None
            }
        });

        let token = match token {
            Some(t) => t,
            None => return Ok(AuthUser { user_id: None }),
        };

        let jwt_service = JwtService::from_ref(state);
        let claims = jwt_service.verify_token(&token)
            .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;

        let user_id: i32 = claims.sub.parse()
            .map_err(|_| AppError::Unauthorized("Invalid user ID in token".to_string()))?;

        Ok(AuthUser { user_id: Some(user_id) })
    }
}