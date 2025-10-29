use std::sync::Arc;

use axum::{
    extract::{Multipart, State}, http::StatusCode, response::{IntoResponse, Response}
};
use object_store::{local::LocalFileSystem, ObjectStore, WriteMultipart};

#[derive(Debug)]
pub enum PhotosUploadRespnose {
    Ok,
    BadRequest,
    InternalServerError
}

impl IntoResponse for PhotosUploadRespnose {
    fn into_response(self) -> Response {
        match self {
            Self::Ok => {
                StatusCode::OK.into_response()
            }
            Self::BadRequest => {
                StatusCode::BAD_REQUEST.into_response()
            }
            Self::InternalServerError => {
                StatusCode::INTERNAL_SERVER_ERROR.into_response()
            }
        }
    }
}

pub async fn photos_upload_handler(
    State(image_store): State<Arc<LocalFileSystem>>,
    mut multipart: Multipart,
) -> PhotosUploadRespnose {
    loop {
        let result = multipart.next_field().await;
        let mut field = match result {
            Err(e) => return {
                tracing::warn!(error = ?e, "Failed to get next field");
                PhotosUploadRespnose::BadRequest
            },
            Ok(None) => break,
            Ok(Some(field)) => field,
        };

        let name = match field.name() {
            Some(name) => name,
            None => continue
        };
        
        if name != "file" {
            continue;
        }

        let file_name = match field.file_name() {
            Some(file_name) => file_name,
            None => {
                tracing::warn!("File name not provided");
                return PhotosUploadRespnose::BadRequest;
            },
        };

        let file_path = object_store::path::Path::from(file_name);

        let result = image_store.put_multipart(&file_path).await;

        let upload = match result {
            Ok(upload) => upload,
            Err(e) => {
                tracing::error!(error = ?e, "Failed to put multipart");
                return PhotosUploadRespnose::InternalServerError;
            },
        };

        let mut writer = WriteMultipart::new(upload);
        loop {
            let result = field.chunk().await;
            let chunk = match result {
                Err(e) => {
                    tracing::error!(error = ?e, "Failed to get chunk");
                    writer.abort().await;
                    return PhotosUploadRespnose::InternalServerError;
                },
                Ok(None) => break,
                Ok(Some(ref chunk)) => chunk,
            };

            writer.write(chunk);
        }
        match writer.finish().await {
            Ok(_) => {
                return PhotosUploadRespnose::Ok;
            },
            Err(e) => {
                tracing::error!(error = ?e, "Failed to finish multipart upload");
                return PhotosUploadRespnose::InternalServerError;
            },
        }
    }
    tracing::warn!("File field not found");
    PhotosUploadRespnose::BadRequest
}
