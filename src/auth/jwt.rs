use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation, decode, encode, errors::Error};
use serde::{Deserialize, Serialize};
use time::{Duration, OffsetDateTime};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
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

    pub fn sign(&self, sub: String, duration: Duration) -> Result<String, Error> {
        let now = OffsetDateTime::now_utc();
        let iat = now.unix_timestamp();
        let exp = (now + duration).unix_timestamp();

        let claims = Claims { sub, iat, exp };

        encode(&Header::default(), &claims, &self.encoding_key)
    }

    pub fn verify(&self, token: &str) -> Result<Claims, Error> {
        let mut validation = Validation::default();
        // 设置 60 秒的时间容忍度
        validation.leeway = 60;

        let token_data = decode::<Claims>(token, &self.decoding_key, &validation)?;

        Ok(token_data.claims)
    }
}
