-- Add migration script here
ALTER TABLE "photo"
ADD COLUMN "make" TEXT,
ADD COLUMN "model" TEXT,
ADD COLUMN "lens_model" TEXT,
ADD COLUMN "aperture" TEXT,
ADD COLUMN "shutter_speed" TEXT,
ADD COLUMN "iso" TEXT,
ADD COLUMN "focal_length" TEXT;
