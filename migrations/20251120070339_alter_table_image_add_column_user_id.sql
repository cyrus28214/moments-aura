ALTER TABLE "image" ADD COLUMN "user_id" INTEGER;

ALTER TABLE "image" ADD CONSTRAINT "fk_image_user_id"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;

CREATE INDEX "idx_image_user_id" ON "image"("user_id");