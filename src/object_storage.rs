use bytes::Bytes;
pub trait ObjectStorage {
    type Error;
    async fn save(&self, data: Bytes) -> Result<String, Self::Error>;
    async fn get(&self, key: &str) -> Result<Bytes, Self::Error>;
    async fn exists(&self, key: &str) -> Result<bool, Self::Error>;
    async fn delete(&self, key: &str) -> Result<bool, Self::Error>;
}
