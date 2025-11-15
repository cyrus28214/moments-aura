use std::sync::Arc;

use axum::{
    Json,
    extract::{Multipart, Path, State},
    http::{StatusCode, HeaderMap, header},
    response::{IntoResponse, Response},
};
use object_store::{HeaderValue, ObjectStore};
use serde::Serialize;
use sqlx::PgPool;

use crate::app::error::AppError;

const MAX_FILES: usize = 1;

fn get_allowed_mime_types() -> Vec<&'static str> {
    vec!["image/jpeg", "image/png", "image/gif", "image/webp"]
}

pub async fn images_upload_handler(
    State(store): State<Arc<dyn ObjectStore>>,
    State(db): State<PgPool>,
    mut multipart: Multipart,
) -> Result<(), AppError> {
    let mut upload_count = 0;
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| AppError::BodyParseFailed(e.to_string()))?
    {
        let name = match field.name() {
            Some(name) => name,
            None => continue,
        };

        if name != "file" {
            continue;
        }

        if upload_count >= MAX_FILES {
            return Err(AppError::BadRequest("Too many files".to_string()));
        }

        let file_name = match field.file_name() {
            Some(name) => String::from(name),
            None => continue,
        };

        let mine_type = match field.content_type() {
            Some(mime_type) => String::from(mime_type),
            None => continue,
        };

        if !get_allowed_mime_types().contains(&mine_type.as_str()) {
            return Err(AppError::BadRequest(format!(
                "Invalid file type: {}",
                mine_type
            )));
        }

        let extension = file_name.split('.').last().unwrap_or("");
        let file_path = format!("images/{}.{}", uuid::Uuid::now_v7(), extension);

        let bytes = field
            .bytes()
            .await
            .map_err(|e| AppError::BodyParseFailed(e.to_string()))?;

        let file_size = bytes.len();

        store
            .put(
                &object_store::path::Path::from(file_path.clone()),
                bytes.into(),
            )
            .await
            .map_err(|e| AppError::InternalServerError(e.to_string()))?;

        sqlx::query!(
            "INSERT INTO image (file_name, file_path, file_size, mime_type) VALUES ($1, $2, $3, $4)",
            file_name,
            file_path,
            file_size as i64,
            mine_type,
        )
        .execute(&db)
        .await
        .map_err(|e| AppError::InternalServerError(e.to_string()))?;

        upload_count += 1;
    }

    if upload_count == 0 {
        return Err(AppError::BodyParseFailed(
            "Valid file field not found".to_string(),
        ));
    }

    Ok(())
}

#[derive(Serialize)]
struct Image {
    id: i32,
    file_name: String,
    file_size: i64,
    url: String,
}

#[derive(Serialize)]
pub struct ImagesListResult {
    images: Vec<Image>,
}

pub async fn images_list_handler(
    State(db): State<PgPool>,
) -> Result<Json<ImagesListResult>, AppError> {
    let images = sqlx::query!("SELECT id, file_name, file_size FROM image")
        .fetch_all(&db)
        .await
        .map_err(|e| AppError::InternalServerError(e.to_string()))?
        .into_iter()
        .map(|image| Image {
            id: image.id,
            file_name: image.file_name,
            file_size: image.file_size,
            url: format!("/images/{}/content", image.id),
        })
        .collect();
    Ok(Json(ImagesListResult { images }))
}

pub async fn images_get_content_handler(
    State(store): State<Arc<dyn ObjectStore>>,
    State(db): State<PgPool>,
    Path(id): Path<u32>,
) -> Result<Response, AppError> {
    let image = sqlx::query!(
        "SELECT file_path, mime_type FROM image WHERE id = $1",
        id as i32
    )
    .fetch_optional(&db)
    .await
    .map_err(|e| AppError::InternalServerError(e.to_string()))?
    .ok_or(AppError::ImageNotFound(id))?;

    let file_path = object_store::path::Path::from(image.file_path);

    let file = store
        .get(&file_path)
        .await
        .map_err(|e| AppError::InternalServerError(e.to_string()))?;

    let bytes = file
        .bytes()
        .await
        .map_err(|e| AppError::InternalServerError(e.to_string()))?;

    let mut headers = HeaderMap::new();

    headers.insert(
        header::CONTENT_TYPE, 
        HeaderValue::from_str(&image.mime_type).map_err(|e| AppError::InternalServerError(e.to_string()))?
    );

    headers.insert(
        header::CONTENT_LENGTH,
        HeaderValue::from(bytes.len() as u64),
    );

    Ok((headers, bytes).into_response())
}
