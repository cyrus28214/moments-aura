use std::sync::Arc;

use axum::extract::{Multipart, State};
use object_store::ObjectStore;

use crate::{app::error::AppError, infra::util::rewrite_file_name};

const MAX_FILES: usize = 1;

pub async fn images_upload_handler(
    State(image_store): State<Arc<dyn ObjectStore>>,
    mut multipart: Multipart,
) -> Result<(), AppError> {
    let mut upload_count = 0;
    while let Some(ref field) = multipart
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

        let origin_file_name = match field.file_name() {
            Some(name) => name,
            None => continue,
        };

        let file_name = rewrite_file_name(origin_file_name);

        let file_path = object_store::path::Path::from(file_name);

        let bytes = field
            .bytes()
            .await
            .map_err(|e| AppError::BodyParseFailed(e.to_string()))?;

        image_store
            .put(&file_path, bytes.into())
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
