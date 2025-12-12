use axum::{
    Json,
    extract::{Multipart, Path, Query, State},
    http::{StatusCode, header},
    response::{IntoResponse, Response},
};
use reverse_geocoder::ReverseGeocoder;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::{ai, auth::AuthUser, exif::parse_exif, images, infra::storage::LocalStorage};

const MAX_UPLOAD_FILES: usize = 16;
pub async fn upload_handler(
    State(storage): State<LocalStorage>,
    State(db): State<PgPool>,
    State(geocoder): State<Arc<ReverseGeocoder>>,
    AuthUser { user_id }: AuthUser,
    mut multipart: Multipart,
) -> Result<Response, (StatusCode, String)> {
    let mut uploaded_count = 0;
    while let Some(field) = multipart.next_field().await.map_err(|_| {
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

        let uploaded_at = time::OffsetDateTime::now_utc();
        let mut captured_at = None;
        let mut latitude = None;
        let mut longitude = None;
        let mut location = None;

        if let Some(exif) = &info.exif {
            let parsed_exif = parse_exif(exif);
            captured_at = parsed_exif.date_time;
            if let Some(coord) = parsed_exif.coordinates {
                latitude = Some(coord.0);
                longitude = Some(coord.1);
                location = Some(format!("{}", geocoder.search(coord).record));
            }
        }

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
    width: i32,
    height: i32,
    uploaded_at: i64,
    tags: Vec<String>,
}

#[derive(Deserialize)]
pub struct ListParams {
    tags: Option<String>,
    untagged: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct ListImagesResponse {
    photos: Vec<Photo>,
}

pub async fn list_handler(
    State(db): State<PgPool>,
    AuthUser { user_id }: AuthUser,
    Query(params): Query<ListParams>,
) -> Result<Response, (StatusCode, String)> {
    let tags_filter: Option<Vec<String>> = params
        .tags
        .map(|s| {
            s.split(',')
                .map(|t| t.trim().to_string())
                .filter(|t| !t.is_empty())
                .collect()
        })
        .filter(|v: &Vec<String>| !v.is_empty());

    let untagged_filter = params.untagged.unwrap_or(false);

    let photos: Vec<Photo> = sqlx::query!(
        r#"
        SELECT
            "photo"."id",
            "photo"."image_hash",
            "photo"."uploaded_at",
            "image"."width",
            "image"."height",
            COALESCE(ARRAY_AGG("tag"."name") FILTER (WHERE "tag"."name" IS NOT NULL), '{}') as "tags!"
        FROM "photo"
        JOIN "image" ON "photo"."image_hash" = "image"."hash"
        LEFT JOIN "photo_tag" ON "photo"."id" = "photo_tag"."photo_id"
        LEFT JOIN "tag" ON "photo_tag"."tag_id" = "tag"."id"

        WHERE "photo"."user_id" = $1
        AND ($2::text[] IS NULL OR EXISTS (
            SELECT 1 FROM "photo_tag" "pt" 
            JOIN "tag" "t" ON "pt"."tag_id" = "t"."id"
            WHERE "pt"."photo_id" = "photo"."id" AND "t"."name" = ANY($2::text[])
        ))
        AND ($3::boolean IS NOT TRUE OR NOT EXISTS (
            SELECT 1 FROM "photo_tag" "pt" WHERE "pt"."photo_id" = "photo"."id"
        ))
        GROUP BY "photo"."id", "image"."width", "image"."height"
        ORDER BY "photo"."uploaded_at" DESC
        "#,
        user_id,
        tags_filter as Option<Vec<String>>,
        untagged_filter
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
        width: v.width,
        height: v.height,
        uploaded_at: v.uploaded_at.unix_timestamp(),
        tags: v.tags.clone(),
    })
    .collect();

    Ok(Json(ListImagesResponse { photos }).into_response())
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

#[derive(Deserialize)]
pub struct TagBatchPayload {
    tag_names: Vec<String>,
    photo_ids: Vec<String>,
}

pub async fn add_tags_batch_handler(
    State(db): State<PgPool>,
    AuthUser { user_id }: AuthUser,
    Json(payload): Json<TagBatchPayload>,
) -> Result<Response, (StatusCode, String)> {
    let mut photo_uuids = Vec::new();
    for id in &payload.photo_ids {
        if let Ok(uuid) = Uuid::parse_str(id) {
            photo_uuids.push(uuid);
        }
    }

    if photo_uuids.is_empty() || payload.tag_names.is_empty() {
        return Ok(Json(json!({"success": true})).into_response());
    }

    // 1. Get or Create Tag IDs
    let mut tag_ids = Vec::new();
    for name in &payload.tag_names {
        // Tag name validation could go here
        if name.trim().is_empty() {
            continue;
        }

        let tag_id = sqlx::query!(
            r#"
            WITH inserted AS (
                INSERT INTO tag (user_id, name) VALUES ($1, $2)
                ON CONFLICT (user_id, name) DO NOTHING
                RETURNING id
            )
            SELECT id FROM inserted
            UNION ALL
            SELECT id FROM tag WHERE user_id = $1 AND name = $2
            LIMIT 1
            "#,
            user_id,
            name
        )
        .fetch_one(&db)
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to get/create tag");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Database error".to_string(),
            )
        })?
        .id;
        if let Some(id) = tag_id {
            tag_ids.push(id);
        }
    }

    // 2. Link tags to photos
    // We can do a bulk insert or loop. Loop is simpler for now given strict type checks in sqlx macros
    for photo_id in &photo_uuids {
        for tag_id in &tag_ids {
            sqlx::query!(
                "INSERT INTO photo_tag (photo_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                photo_id,
                tag_id
            )
            .execute(&db)
            .await
            .map_err(|e| {
                tracing::error!(error = ?e, "Failed to link tag");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Database error".to_string(),
                )
            })?;
        }
    }

    Ok(Json(json!({
        "success": true
    }))
    .into_response())
}

pub async fn delete_tags_batch_handler(
    State(db): State<PgPool>,
    AuthUser { user_id }: AuthUser,
    Json(payload): Json<TagBatchPayload>,
) -> Result<Response, (StatusCode, String)> {
    let mut photo_uuids = Vec::new();
    for id in &payload.photo_ids {
        if let Ok(uuid) = Uuid::parse_str(id) {
            photo_uuids.push(uuid);
        }
    }

    if photo_uuids.is_empty() || payload.tag_names.is_empty() {
        return Ok(Json(json!({"success": true})).into_response());
    }

    // Resolve tag IDs first to ensure we only delete user's tags?
    // Actually we can just join or subquery.
    // DELETE FROM photo_tag WHERE photo_id IN (...) AND tag_id IN (SELECT id FROM tag WHERE name IN (...) AND user_id = ...)

    sqlx::query!(
        r#"
        DELETE FROM photo_tag 
        WHERE photo_id = ANY($1) 
        AND tag_id IN (
            SELECT id FROM tag WHERE name = ANY($2) AND user_id = $3
        )
        "#,
        &photo_uuids,
        &payload.tag_names,
        user_id
    )
    .execute(&db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to delete tags");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Database error".to_string(),
        )
    })?;

    Ok(Json(json!({
        "success": true
    }))
    .into_response())
}
#[derive(Serialize)]
pub struct RecommendTagsResponse {
    tags: Vec<String>,
}

pub async fn recommend_tags_handler(
    State(storage): State<LocalStorage>,
    State(db): State<PgPool>,
    State(ai_service): State<Arc<ai::AiService>>,
    Path(photo_id): Path<Uuid>,
    AuthUser { user_id }: AuthUser,
) -> Result<Response, (StatusCode, String)> {
    // 1. Fetch image info to check ownership and get hash
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
        tracing::error!(error = ?e, "Failed to fetch image info");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?
    .ok_or_else(|| (StatusCode::NOT_FOUND, "Image not found".to_string()))?;

    // 2. Fetch image content
    let bytes = storage.get(&photo.hash).map_err(|e| {
        tracing::error!(error = ?e, "Failed to get image content for AI analysis");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?;

    // 3. Determine MIME type
    let mime_type = match photo.extension.as_str() {
        "jpeg" | "jpg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        _ => {
            return Err((
                StatusCode::BAD_REQUEST,
                "Unsupported image format for AI analysis".to_string(),
            ));
        }
    };

    // 4. Call AI Service
    let tags = ai_service
        .recommend_tags(&bytes, mime_type)
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "AI service failed");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("AI Analysis failed: {}", e),
            )
        })?;

    Ok(Json(RecommendTagsResponse { tags }).into_response())
}
