-- Add migration script here
CREATE TYPE tag_source AS ENUM ('user', 'auto', 'system');

CREATE TABLE IF NOT EXISTS "image_tag" (
    "id" SERIAL PRIMARY KEY,
    "image_id" INTEGER NOT NULL REFERENCES "image"(id) ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "source" tag_source NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("image_id", "name")
);

CREATE INDEX idx_image_tag_image_id ON "image_tag"("image_id");
CREATE INDEX idx_image_tag_source ON "image_tag"("source");
CREATE INDEX idx_image_tag_name ON "image_tag"(lower("name"));

CREATE TRIGGER set_updated_at_column
BEFORE UPDATE ON "image_tag"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();