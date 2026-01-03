use axum::http::StatusCode;
use bytes::Bytes;
use exif::Exif;
use image::ImageReader;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use std::io::Cursor;

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
    pub exif: Option<Exif>,
}

pub fn get_image_info<B: AsRef<[u8]>>(image_bytes: B) -> Result<ImageInfo, (StatusCode, String)> {
    let hash = get_image_hash(&image_bytes);
    let size = image_bytes.as_ref().len() as u64;
    // meta data
    let cursor = Cursor::new(&image_bytes);
    let reader = ImageReader::new(cursor)
        .with_guessed_format()
        .map_err(|e| {
            tracing::warn!(error = ?e, "Failed to read image");
            (StatusCode::BAD_REQUEST, "Invalid image format".to_string())
        })?;
    let format = reader
        .format()
        .ok_or((StatusCode::BAD_REQUEST, "Invalid image format".to_string()))?;
    let extension = match format {
        image::ImageFormat::Jpeg => "jpeg",
        image::ImageFormat::Png => "png",
        image::ImageFormat::Gif => "gif",
        image::ImageFormat::WebP => "webp",
        _ => {
            tracing::info!("Invalid image format: {:?}", format);
            return Err((StatusCode::BAD_REQUEST, "Invalid image format".to_string()));
        }
    };
    let (width, height) = reader.into_dimensions().map_err(|e| {
        tracing::warn!(error = ?e, "Failed to read image dimensions");
        (StatusCode::BAD_REQUEST, "Invalid image format".to_string())
    })?;
    let exif = get_image_exif(image_bytes.as_ref());
    Ok(ImageInfo {
        hash,
        size,
        extension: extension.to_string(),
        width,
        height,
        exif,
    })
}

fn generate_thumbnail(image_bytes: &[u8]) -> Result<Vec<u8>, (StatusCode, String)> {
    let img = image::load_from_memory(image_bytes).map_err(|e| {
        tracing::warn!(error = ?e, "Failed to load image for thumbnail");
        (StatusCode::BAD_REQUEST, "Invalid image format".to_string())
    })?;

    let thumbnail = img.resize(512, 512, image::imageops::FilterType::Lanczos3);

    let mut buffer = Cursor::new(Vec::new());
    thumbnail
        .write_to(&mut buffer, image::ImageFormat::Jpeg)
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to encode thumbnail");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to encode thumbnail".to_string(),
            )
        })?;

    Ok(buffer.into_inner())
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

    if !exists {
        // Generate thumbnail
        let thumbnail_bytes = generate_thumbnail(&image_bytes)?;
        let thumbnail_key = format!("{}_thumb", info.hash);

        // save thumbnail to object storage
        storage
            .save(&thumbnail_key, Bytes::from(thumbnail_bytes))
            .map_err(|e| {
                tracing::error!(
                    error = ?e,
                    object = thumbnail_key,
                    "Failed to save thumbnail"
                );
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_string(),
                )
            })?;

        // save to object storage
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
        r#"INSERT INTO "image" ("hash", "size", "extension", "width", "height") VALUES ($1, $2, $3, $4, $5) ON CONFLICT ("hash") DO NOTHING"#,
        info.hash,
        info.size as i64,
        info.extension,
        info.width as i64,
        info.height as i64
    )
    .execute(db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to insert image metadata");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?;

    Ok(info)
}

pub fn get_or_create_thumbnail(
    hash: &str,
    storage: &LocalStorage,
) -> Result<Bytes, (StatusCode, String)> {
    let thumbnail_key = format!("{}_thumb", hash);

    if let Ok(true) = storage.exists(&thumbnail_key) {
        return storage.get(&thumbnail_key).map_err(|e| {
            tracing::error!(error = ?e, "Failed to read thumbnail");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            )
        });
    }

    // Lazy generation
    let original_bytes = storage.get(hash).map_err(|e| {
        tracing::error!(error = ?e, "Failed to read original image for thumbnail generation");
        (StatusCode::NOT_FOUND, "Image not found".to_string())
    })?;

    let thumbnail_bytes = generate_thumbnail(&original_bytes)?;

    storage
        .save(&thumbnail_key, Bytes::from(thumbnail_bytes.clone()))
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to save generated thumbnail");
            // Log error but return the generated bytes anyway
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            )
        })?;

    Ok(Bytes::from(thumbnail_bytes))
}
