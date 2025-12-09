-- Add migration script here
ALTER TABLE "image"
    ADD COLUMN "exif_details" JSONB,
    ADD COLUMN "image_width" INTEGER NOT NULL,
    ADD COLUMN "image_height" INTEGER NOT NULL,
    ADD COLUMN "camera_make" TEXT,
    ADD COLUMN "camera_model" TEXT,
    ADD COLUMN "location" TEXT,
    ADD COLUMN "longitude" DOUBLE PRECISION,
    ADD COLUMN "latitude" DOUBLE PRECISION,
    ADD COLUMN "captured_at" TIMESTAMP,
    ADD COLUMN "uploaded_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;