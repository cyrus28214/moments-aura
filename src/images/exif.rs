use std::io::Cursor;

pub fn extract_exif(image_bytes: &[u8]) -> Option<exif::Exif> {
    let mut cursor = Cursor::new(image_bytes);

    let reader = exif::Reader::new();
    let exif = match reader.read_from_container(&mut cursor) {
        Ok(exif) => exif,
        Err(e) => {
            tracing::warn!("Failed to read EXIF data: {}", e);
            return None;
        }
    };

    Some(exif)
}
