use axum::{
    Json,
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;
use sqlx::PgPool;

use crate::auth::AuthUser;

#[derive(Serialize)]
pub struct TagWithCount {
    name: String,
    count: i64,
}

#[derive(Serialize)]
pub struct ListTagsResponse {
    tags: Vec<TagWithCount>,
}

pub async fn list_tags_handler(
    State(db): State<PgPool>,
    AuthUser { user_id }: AuthUser,
) -> Result<Response, (StatusCode, String)> {
    let tags = sqlx::query_as!(
        TagWithCount,
        r#"
        SELECT "t"."name", COUNT("pt"."photo_id") as "count!"
        FROM "tag" "t"
        JOIN "photo_tag" "pt" ON "t"."id" = "pt"."tag_id"
        JOIN "photo" "p" ON "pt"."photo_id" = "p"."id"
        WHERE "p"."user_id" = $1
        GROUP BY "t"."name"
        HAVING COUNT("pt"."photo_id") > 0
        ORDER BY "count!" DESC
        "#,
        user_id
    )
    .fetch_all(&db)
    .await
    .map_err(|e| {
        tracing::error!(error = ?e, "Failed to fetch tags");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "Internal server error".to_string(),
        )
    })?;

    Ok(Json(ListTagsResponse { tags }).into_response())
}
