use axum::{Json, extract::{Multipart, Path, State}, http::{StatusCode, header}, response::{IntoResponse, Response}};
use serde::{Deserialize, Serialize};
use serde_json::json;
use object_store::ObjectStore;
use sqlx::PgPool;
use crate::app::auth::AuthUser;
use std::sync::Arc;

#[derive(Serialize)]
pub struct Image {
    id: i32,
    file_name: String,
    file_size: i64,
}

pub enum FileType {
    Jpeg,
    Png,
    Gif,
    Webp,
}

impl FileType {
    fn from_mime_type(mime_type: &str) -> Option<FileType> {
        match mime_type {
            "image/jpeg" => Some(FileType::Jpeg),
            "image/png" => Some(FileType::Png),
            "image/gif" => Some(FileType::Gif),
            "image/webp" => Some(FileType::Webp),
            _ => None,
        }
    }

    fn to_extension(self) -> &'static str {
        match self {
            FileType::Jpeg => "jpg",
            FileType::Png => "png",
            FileType::Gif => "gif",
            FileType::Webp => "webp",
        }
    }
}

const MAX_UPLOAD_FILES: usize = 16;
pub async fn upload_images_handler(
    State(store): State<Arc<dyn ObjectStore>>,
    State(db): State<PgPool>,
    AuthUser { user_id }: AuthUser,
    mut multipart: Multipart,
) -> Result<Response, (StatusCode, String)> {
    let mut uploaded_count = 0;
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, "Failed to parse multipart".to_string()))?
    {
        let name = match field.name() {
            Some(name) => name,
            None => continue,
        };
        
        if name != "file" {
            continue;
        }

        if uploaded_count >= MAX_UPLOAD_FILES {
            return Err((StatusCode::BAD_REQUEST, format!("Too many files, at most {} files are allowed", MAX_UPLOAD_FILES)));
        }

        let file_name = match field.file_name() {
            Some(name) => String::from(name),
            None => continue,
        };

        let mine_type = match field.content_type() {
            Some(mime_type) => String::from(mime_type),
            None => continue,
        };

        let file_type = match FileType::from_mime_type(mine_type.as_str()) {
            Some(file_type) => file_type,
            None => continue,
        };

        let extension = file_type.to_extension();
        let file_path = format!("images/{}.{}", uuid::Uuid::now_v7(), extension);

        let bytes = field
            .bytes()
            .await
            .map_err(|e| {
                tracing::error!(error = ?e, "Failed to read bytes from field");
                (StatusCode::BAD_REQUEST, "Internal server error".to_string())
            })?;

        let file_size = bytes.len();

        store
            .put(
                &object_store::path::Path::from(file_path.clone()),
                bytes.into(),
            )
            .await
            .map_err(|e| {
                tracing::error!(error = ?e, "Failed to store file");
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            })?;

        sqlx::query!(
            "INSERT INTO image (file_name, file_path, file_size, mime_type, user_id) VALUES ($1, $2, $3, $4, $5)",
            file_name,
            file_path,
            file_size as i64,
            mine_type,
            user_id,
        )
        .execute(&db)
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to insert image");
            (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
        })?;

        uploaded_count += 1;
    }
    
    Ok(Json(json!({
        "uploaded_count": uploaded_count,
    })).into_response())
}

pub async fn list_images_handler(
    State(db): State<PgPool>,
    AuthUser { user_id: auth_user_id }: AuthUser,
) -> Result<Response, (StatusCode, String)> {
    let images = sqlx::query_as!(
        Image,
        "SELECT id, file_name, file_size FROM image WHERE user_id = $1",
        auth_user_id
    )
        .fetch_all(&db)
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to fetch images");
            (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
        })?;

    let json = json!({
        "images": images,
    });

    Ok(Json(json).into_response())
}

pub async fn get_image_content_handler(
    State(store): State<Arc<dyn ObjectStore>>,
    State(db): State<PgPool>,
    Path(image_id): Path<i32>,
    AuthUser { user_id: auth_user_id }: AuthUser,
) -> Result<Response, (StatusCode, String)> {
    let image = sqlx::query!(
        "SELECT id, file_path, mime_type FROM image WHERE id = $1 AND user_id = $2",
        image_id,
        auth_user_id
    )
        .fetch_optional(&db)
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to fetch image");
            (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
        })?
        .ok_or_else(|| (StatusCode::NOT_FOUND, "Image not found".to_string()))?;

    let file_path = object_store::path::Path::from(image.file_path);
    let file = store
        .get(&file_path)
        .await.map_err(|e| {
        tracing::error!(error = ?e, "Failed to get file");
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
    })?;

    let bytes = file.bytes().await.map_err(|e| {
        tracing::error!(error = ?e, "Failed to read file bytes");
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
    })?;

    Ok(([
        (header::CONTENT_TYPE, image.mime_type),
        (header::CONTENT_LENGTH, bytes.len().to_string()),
    ], bytes).into_response())
}

#[derive(Deserialize)]
pub struct DeleteImagesPayload {
    image_ids: Vec<i32>,
}

pub async fn delete_images_handler(
    State(db): State<PgPool>,
    AuthUser { user_id: auth_user_id }: AuthUser,
    Json(payload): Json<DeleteImagesPayload>,
) -> Result<Response, (StatusCode, String)> {
    sqlx::query!("DELETE FROM image WHERE id = ANY($1) AND user_id = $2", &payload.image_ids, auth_user_id)
        .execute(&db)
        .await
        .map_err(|e| {
            tracing::error!(error = ?e, "Failed to delete images");
            (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
        })?;
    Ok(Json(json!({
        "deleted_image_ids": payload.image_ids,
    })).into_response())
}