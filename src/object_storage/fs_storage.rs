use super::ObjectStorage;
use bytes::Bytes;
use std::io;
use std::path::PathBuf;
use tokio::fs;
pub struct FsStorage {
    path: PathBuf,
}

impl FsStorage {
    pub async fn new(path: PathBuf) -> io::Result<Self> {
        fs::create_dir_all(&path).await?;
        Ok(Self { path })
    }
}

enum Error {
    Io(io::Error),
    Other(String),
}

impl ObjectStorage for FsStorage {
    type Error = Error;
    async fn save(&self, data: Bytes) -> Result<String, Self::Error> {
        todo!()
    }
    async fn get(&self, key: &str) -> Result<Bytes, Self::Error> {
        todo!()
    }
    async fn exists(&self, key: &str) -> Result<bool, Self::Error> {
        todo!()
    }
    async fn delete(&self, key: &str) -> Result<bool, Self::Error> {
        todo!()
    }
}
