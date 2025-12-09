use axum::http::StatusCode;
use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use time::{Duration, OffsetDateTime};
use tracing::error;

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthClaims {
    pub sub: String,
    pub iat: i64,
    pub exp: i64,
}

#[derive(Clone)]
pub struct JwtService {
    encoding_key: EncodingKey,
    decoding_key: DecodingKey,
}

impl JwtService {
    pub fn new(secret: &[u8]) -> Self {
        Self {
            encoding_key: EncodingKey::from_secret(secret),
            decoding_key: DecodingKey::from_secret(secret),
        }
    }

    pub fn sign(&self, sub: String, duration: Duration) -> Result<String, (StatusCode, String)> {
        let now = OffsetDateTime::now_utc();
        let iat = now.unix_timestamp();
        let exp = (now + duration).unix_timestamp();

        let claims = AuthClaims { sub, iat, exp };

        encode(&Header::default(), &claims, &self.encoding_key).map_err(|e| {
            error!(error = e.to_string(), "Failed to sign claims");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            )
        })
    }

    pub fn verify(&self, token: &str) -> Result<AuthClaims, (StatusCode, String)> {
        let mut validation = Validation::default();
        // 设置 60 秒的时间容忍度
        validation.leeway = 60;

        let token_data = decode::<AuthClaims>(token, &self.decoding_key, &validation)
            .map_err(|_| (StatusCode::UNAUTHORIZED, "Invalid token".to_string()))?;

        Ok(token_data.claims)
    }
}
