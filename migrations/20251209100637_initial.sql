-- Add migration script here

CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 用户表
CREATE TABLE IF NOT EXISTS "user" (
    "id" UUID PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_column
BEFORE UPDATE ON "user"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

-- 图片表
-- 这里只存和文件物理内容强绑定的属性
CREATE TABLE "image" (
    "hash" TEXT PRIMARY KEY, -- SHA256 HEX
    "size" BIGINT NOT NULL,
    "extension" TEXT NOT NULL, -- jpeg, png, ...
    -- "storage_uri" VARCHAR(255) NOT NULL,   -- 实际存储路径 (如: ab/cd/abcd...，后续可以扩展到 s3://...)
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_column
BEFORE UPDATE ON "image"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

-- 逻辑照片表
-- 这里存用户关心的业务属性
CREATE TABLE "photo" (
    "id" UUID PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "user"("id"),
    "image_hash" TEXT NOT NULL REFERENCES "image"("hash"),
    "captured_at" TIMESTAMP,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "location" TEXT,
    "uploaded_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TRIGGER set_updated_at_column
BEFORE UPDATE ON "photo"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();