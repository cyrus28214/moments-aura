-- Add tags table
CREATE TABLE "tag" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE ("user_id", "name")
);

-- Add photo_tags table (many-to-many relationship)
CREATE TABLE "photo_tag" (
    "photo_id" UUID NOT NULL REFERENCES "photo"("id") ON DELETE CASCADE,
    "tag_id" UUID NOT NULL REFERENCES "tag"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("photo_id", "tag_id")
);

-- Trigger for updated_at is not strictly needed for join/simple tables unless we track modifications
-- But having indices is good.
CREATE INDEX "idx_photo_tag_tag_id" ON "photo_tag" ("tag_id");
CREATE INDEX "idx_tag_user_id" ON "tag" ("user_id");
