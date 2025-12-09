use bytes::Bytes;
use std::{fs, io::Write, path::PathBuf};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum StorageError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Storage generic error: {0}")]
    Other(String),
}
#[derive(Debug, Clone)]
pub struct LocalStorage {
    base_path: PathBuf,
}

impl LocalStorage {
    pub fn new(base_path: PathBuf) -> Self {
        if !fs::exists(&base_path).expect("failed to check storage root existence") {
            fs::create_dir_all(&base_path).expect("failed to create storage root");
        }
        Self { base_path }
    }

    /// 策略：使用前 4 个字符做两级目录散列
    /// Key: "e3b0c44298fc..." -> Path: "base/e3/b0/e3b0c44298fc..."
    fn get_full_path(&self, key: &str) -> PathBuf {
        if key.len() < 4 {
            return self.base_path.join(key);
        }
        let p1 = &key[0..2];
        let p2 = &key[2..4];
        self.base_path.join(p1).join(p2).join(key)
    }

    pub fn save(&self, key: &str, data: Bytes) -> Result<(), StorageError> {
        let path = self.get_full_path(key);

        // 确保父目录存在
        if let Some(parent) = path.parent() {
            if !parent.exists() {
                fs::create_dir_all(parent)?;
            }
        }

        // 写入文件
        let mut file = fs::File::create(&path)?;
        file.write_all(&data)?;

        Ok(())
    }

    pub fn get(&self, key: &str) -> Result<Bytes, StorageError> {
        let path = self.get_full_path(key);
        let data = fs::read(path)?;
        Ok(Bytes::from(data))
    }

    pub fn exists(&self, key: &str) -> Result<bool, StorageError> {
        let path = self.get_full_path(key);
        Ok(path.exists())
    }
}
