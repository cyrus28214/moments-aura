-- Add migration script here
CREATE TABLE IF NOT EXISTS photo (
    id SERIAL PRIMARY KEY,
    file_name TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON photo
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();