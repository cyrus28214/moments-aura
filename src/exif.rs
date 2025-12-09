use std::io::Cursor;

use axum::http::StatusCode;
use exif::{Exif, Tag};
use time::{PrimitiveDateTime, macros::format_description};

pub fn get_image_exif<B: AsRef<[u8]>>(image_bytes: B) -> Result<Exif, (StatusCode, String)> {
    let mut cursor = Cursor::new(image_bytes);
    let reader = exif::Reader::new();
    let exif = reader
        .read_from_container(&mut cursor)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid image format".to_string()))?;
    Ok(exif)
}

pub struct ParseExifResult {
    pub date_time: Option<PrimitiveDateTime>,
    pub coordinates: Option<(f64, f64)>,
}

pub fn parse_exif(exif: &Exif) -> ParseExifResult {
    let mut date_time: Option<PrimitiveDateTime> = None;
    let mut latitude: Option<f64> = None;
    let mut longitude: Option<f64> = None;
    let mut latitude_sign: f64 = 1.0;
    let mut longitude_sign: f64 = 1.0;
    for field in exif.fields() {
        match field.tag {
            Tag::DateTimeOriginal => {
                if let exif::Value::Ascii(ref v) = field.value {
                    let v = &v[0];
                    date_time = match time::PrimitiveDateTime::parse(
                        &String::from_utf8_lossy(v),
                        format_description!("[year]:[month]:[day] [hour]:[minute]:[second]"),
                    ) {
                        Ok(t) => Some(t),
                        Err(_) => None,
                    }
                }
            }
            Tag::GPSLatitude => {
                if let exif::Value::Rational(ref v) = field.value {
                    let v = &v[0];
                    latitude = Some(v.num as f64 / v.denom as f64);
                }
            }
            Tag::GPSLongitude => {
                if let exif::Value::Rational(ref v) = field.value {
                    let v = &v[0];
                    longitude = Some(v.num as f64 / v.denom as f64);
                }
            }
            Tag::GPSLatitudeRef => {
                if let exif::Value::Ascii(ref v) = field.value {
                    let v = &v[0];
                    latitude_sign = if v[0] == b'S' { -1.0 } else { 1.0 };
                }
            }
            Tag::GPSLongitudeRef => {
                if let exif::Value::Ascii(ref v) = field.value {
                    let v = &v[0];
                    longitude_sign = if v[0] == b'W' { -1.0 } else { 1.0 };
                }
            }
            _ => {}
        }
    }
    let coordinates = match (latitude, longitude) {
        (Some(latitude), Some(longitude)) => {
            Some((latitude_sign * latitude, longitude_sign * longitude))
        }
        _ => None,
    };
    ParseExifResult {
        date_time,
        coordinates,
    }
}
