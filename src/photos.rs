use axum::{
    Json,
    extract::{Multipart, Path, State},
    http::{StatusCode, header},
    response::{IntoResponse, Response},
};
use reverse_geocoder::ReverseGeocoder;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::{auth::AuthUser, exif::parse_exif, images, infra::storage::LocalStorage};

const MAX_UPLOAD_FILES: usize = 16;
pub async fn upload_handler(
    State(storage): State<LocalStorage>,
    State(db): State<PgPool>,
    State(geocoder): State<Arc<ReverseGeocoder>>,
    AuthUser { user_id }: AuthUser,
    mut multipart: Multipart,
) -> Result<Response, (StatusCode, String)> {
    let mut uploaded_count = 0;
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            "Failed to parse multipart".to_string(),
        )
    })? {
        match (field.name(), field.content_type()) {
            (Some("file"), Some("image/jpeg" | "image/png" | "image/gif" | "image/webp")) => (),
            _ => continue,
        };

        if uploaded_count >= MAX_UPLOAD_FILES {
            return Err((
                StatusCode::BAD_REQUEST,
                format!(
                    "Too many files, at most {} files are allowed",
                    MAX_UPLOAD_FILES
                ),
            ));
        }

        let bytes = field.bytes().await.map_err(|e| {
            tracing::error!(error = ?e, "Failed to read bytes from field");
            (StatusCode::BAD_REQUEST, "Internal server error".to_string())
        })?;

        let info = images::save_image(bytes, &storage, &db).await?;

        let photo_id = uuid::Uuid::now_v7();

        let parsed_exif = parse_exif(&info.exif);

        let uploaded_at = time::OffsetDateTime::now_utc();
        let captured_at = parsed_exif.date_time;
        let (latitude, longitude, location) = match parsed_exif.coordinates {
            None => (None, None, None),
            Some((latitude, longitude)) => {
                let location = geocoder.search((latitude, longitude));
                let location = format!("{}", location.record);
                (Some(latitude), Some(longitude), Some(location))
            }
        };

        sqlx::query!(
            "INSERT INTO photo (id, user_id, image_hash, uploaded_at, captured_at, latitude, longitude, location) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            photo_id,
            user_id,
            info.hash,
            uploaded_at,
            captured_at,
            latitude,
            longitude,
            location
        )
        .execute(&db)
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to insert image");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error".to_string(),
            )
        })?;

        uploaded_count += 1;
    }
    Ok(Json(json!({
        "uploaded_count": uploaded_count,
    }))
    .into_response())
}

#[derive(Debug, Serialize)]
struct Photo {
    id: String,
    image_hash: String,
    uploaded_at: i64,
}

pub async fn list_handler(
    State(db): State<PgPool>,
    AuthUser { user_id }: AuthUser,
) -> Result<Response, (StatusCode, String)> {
    let photos: Vec<Photo> = sqlx::query!(
        r#"SELECT "id", "image_hash", "uploaded_at" FROM "photo" WHERE "user_id" = $1 ORDER BY "uploaded_at" DESC"#,
        user_id
    )
    .fetch_all(&db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to fetch images");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?
    .iter()
    .map(|v| Photo {
        id: v.id.to_string(),
        image_hash: v.image_hash.clone(),
        uploaded_at: v.uploaded_at.unix_timestamp()
    })
    .collect();

    let json = json!({
        "photos": photos
    });

    Ok(Json(json).into_response())
}

pub async fn get_content_handler(
    State(storage): State<LocalStorage>,
    State(db): State<PgPool>,
    Path(photo_id): Path<Uuid>,
    AuthUser { user_id }: AuthUser,
) -> Result<Response, (StatusCode, String)> {
    let photo = sqlx::query!(
        r#"SELECT
            "image"."hash",
            "image"."extension"
        FROM "photo"
        JOIN "image" ON "photo"."image_hash" = "image"."hash"
        WHERE "photo"."id" = $1 AND "photo"."user_id" = $2"#,
        photo_id,
        user_id
    )
    .fetch_optional(&db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to fetch image");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "Image not found".to_string()))?;

    let bytes = storage.get(&photo.hash).map_err(|e| {
        tracing::error!(error = ?e, "Failed to get image content");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Interval server error".to_string(),
        )
    })?;

    let content_type = match photo.extension.as_str() {
        "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        _ => "application/octet-stream",
    };

    Ok((
        [
            (header::CONTENT_TYPE, content_type),
            (header::CONTENT_LENGTH, bytes.len().to_string().as_ref()),
        ],
        bytes,
    )
        .into_response())
}

#[derive(Deserialize)]
pub struct DeleteBatchPayload {
    image_ids: Vec<String>,
}

pub async fn delete_batch_handler(
    State(db): State<PgPool>,
    AuthUser { user_id }: AuthUser,
    Json(payload): Json<DeleteBatchPayload>,
) -> Result<Response, (StatusCode, String)> {
    let mut image_ids_uuid = Vec::new();
    for image_id in &payload.image_ids {
        let uuid = uuid::Uuid::parse_str(&image_id).map_err(|_| {
            tracing::error!("Invalid image id");
            (StatusCode::BAD_REQUEST, "Invalid image id".to_string())
        })?;
        image_ids_uuid.push(uuid);
    }
    sqlx::query!(
        "DELETE FROM photo WHERE id = ANY($1) AND user_id = $2",
        &image_ids_uuid,
        user_id
    )
    .execute(&db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to delete images");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?;
    Ok(Json(json!({
        "deleted_image_ids": payload.image_ids,
    }))
    .into_response())
}
