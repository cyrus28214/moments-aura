use std::sync::Arc;

use axum::extract::{Multipart, State};
use object_store::ObjectStore;
use sqlx::PgPool;

use crate::app::error::AppError;

const MAX_FILES: usize = 1;

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

        let file_name_sanitized = file_name
            .clone()
            .replace(|c: char| c != '.' && !c.is_ascii_alphanumeric(), "_");

        let file_path = format!("images/{}_{}", uuid::Uuid::now_v7(), file_name_sanitized);

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
            "INSERT INTO image (file_name, file_path, file_size) VALUES ($1, $2, $3)",
            file_name,
            file_path,
            file_size as i64
        )
        .execute(&db)
        .await
        .map_err(|e| AppError::InternalServerError(e.to_string()))?;

        upload_count += 1;
    }

    if upload_count == 0 {
        return Err(AppError::BodyParseFailed(
            "File field not found".to_string(),
        ));
    }

    Ok(())
}
