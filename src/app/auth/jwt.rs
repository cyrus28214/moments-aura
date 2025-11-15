use time::{OffsetDateTime, Duration};
use jsonwebtoken::{encode, decode, EncodingKey, DecodingKey, Header, errors::Error, Validation};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub iat: usize,
    pub exp: usize,
}

#[derive(Debug, Clone)]
pub struct JwtService {
    secret: Vec<u8>,
}

impl JwtService {
    pub fn new(secret: Vec<u8>) -> Self {
        Self { secret }
    }

    pub fn generate_token(&self, user_id: String) -> Result<String, Error> {
        let sub = user_id.clone();
        let now = OffsetDateTime::now_utc();
        let iat = now.unix_timestamp() as usize;
        let exp = (now + Duration::hours(48)).unix_timestamp() as usize;

        let claims = Claims {
            sub,
            iat,
            exp,
        };

        let header = Header::default();

        encode(&header, &claims, &EncodingKey::from_secret(&self.secret))
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims, Error> {
        let validation = Validation::default();
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(&self.secret),
            &validation,
        )?;
        Ok(token_data.claims)
    }
}