use axum::http::StatusCode;
use bytes::Bytes;
use exif::Exif;
use image::ImageReader;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use std::{collections::HashMap, io::Cursor};

use crate::{exif::get_image_exif, infra::storage::LocalStorage};

pub fn get_image_hash<B: AsRef<[u8]>>(image_bytes: B) -> String {
    let hash = Sha256::digest(image_bytes);
    let hash_str = format!("{:x}", hash);
    hash_str
}

pub struct ImageInfo {
    pub hash: String,
    pub size: u64,
    pub extension: String,
    pub width: u32,
    pub height: u32,
    pub exif: Exif,
}

pub fn get_image_info<B: AsRef<[u8]>>(image_bytes: B) -> Result<ImageInfo, (StatusCode, String)> {
    let hash = get_image_hash(&image_bytes);
    let size = image_bytes.as_ref().len() as u64;
    // meta data
    let cursor = Cursor::new(&image_bytes);
    let reader = ImageReader::new(cursor)
        .with_guessed_format()
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid image format".to_string()))?;
    let format = reader
        .format()
        .ok_or((StatusCode::BAD_REQUEST, "Invalid image format".to_string()))?;
    let extension = match format {
        image::ImageFormat::Jpeg => "jpeg",
        image::ImageFormat::Png => "png",
        image::ImageFormat::Gif => "gif",
        image::ImageFormat::WebP => "webp",
        _ => return Err((StatusCode::BAD_REQUEST, "Invalid image format".to_string())),
    };
    let (width, height) = reader
        .into_dimensions()
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid image format".to_string()))?;
    let exif = get_image_exif(image_bytes.as_ref())?;
    Ok(ImageInfo {
        hash,
        size,
        extension: extension.to_string(),
        width,
        height,
        exif,
    })
}

pub async fn save_image(
    image_bytes: Bytes,
    storage: &LocalStorage,
    db: &PgPool,
) -> Result<ImageInfo, (StatusCode, String)> {
    let info = get_image_info(&image_bytes)?;
    let exists = storage.exists(&info.hash).map_err(|e| {
        tracing::error!(
            error = ?e,
            object = info.hash,
            "Fail to check existence of object"
        );
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?;

    // save to object storage
    if !exists {
        storage.save(&info.hash, image_bytes).map_err(|e| {
            tracing::error!(
                error = ?e,
                object = info.hash,
                "Failed to save object"
            );
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            )
        })?;
    }

    // save to database
    sqlx::query!(
        r#"INSERT INTO "image" ("hash", "size", "extension", "width", "height") VALUES ($1, $2, $3, $4, $5)"#,
        info.hash,
        info.size as i64,
        info.extension,
        info.width as i64,
        info.height as i64
    )
    .execute(db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Interval server error".to_string(),
        )
    })?;
    Ok(info)
}
