-- Add migration script here
ALTER TABLE "image"
    ADD COLUMN exif_data JSONB,
    ADD COLUMN captured_at TIMESTAMPTZ,
    ADD COLUMN location TEXT,
    ADD COLUMN resolution TEXT,
    ADD COLUMN camera_model TEXT,
    ADD COLUMN lens_model TEXT,
    ADD COLUMN iso INTEGER;

CREATE INDEX idx_image_captured_at ON "image"(captured_at);
CREATE INDEX idx_image_resolution ON "image"(resolution);
CREATE INDEX idx_image_camera_model ON "image"(lower(camera_model));
CREATE INDEX idx_image_exif_data ON "image" USING GIN (exif_data);