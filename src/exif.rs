use std::io::Cursor;

use exif::{Exif, Tag};
use time::{PrimitiveDateTime, macros::format_description};

pub fn get_image_exif<B: AsRef<[u8]>>(image_bytes: B) -> Option<Exif> {
    let mut cursor = Cursor::new(image_bytes);
    let reader = exif::Reader::new();
    reader.read_from_container(&mut cursor).ok()
}

pub struct ParseExifResult {
    pub date_time: Option<PrimitiveDateTime>,
    pub coordinates: Option<(f64, f64)>,
    pub make: Option<String>,
    pub model: Option<String>,
    pub lens_model: Option<String>,
    pub aperture: Option<String>,
    pub shutter_speed: Option<String>,
    pub iso: Option<String>,
    pub focal_length: Option<String>,
}

pub fn parse_exif(exif: &Exif) -> ParseExifResult {
    let mut date_time: Option<PrimitiveDateTime> = None;
    let mut latitude: Option<f64> = None;
    let mut longitude: Option<f64> = None;
    let mut latitude_sign: f64 = 1.0;
    let mut longitude_sign: f64 = 1.0;
    let mut make: Option<String> = None;
    let mut model: Option<String> = None;
    let mut lens_model: Option<String> = None;
    let mut aperture: Option<String> = None;
    let mut shutter_speed: Option<String> = None;
    let mut iso: Option<String> = None;
    let mut focal_length: Option<String> = None;

    for field in exif.fields() {
        match field.tag {
            Tag::Make => make = Some(field.display_value().with_unit(exif).to_string()),
            Tag::Model => model = Some(field.display_value().with_unit(exif).to_string()),
            Tag::LensModel => lens_model = Some(field.display_value().with_unit(exif).to_string()),
            Tag::FNumber => aperture = Some(field.display_value().with_unit(exif).to_string()),
            Tag::ExposureTime => shutter_speed = Some(field.display_value().with_unit(exif).to_string()),
            Tag::PhotographicSensitivity => iso = Some(field.display_value().with_unit(exif).to_string()),
            Tag::FocalLength => focal_length = Some(field.display_value().with_unit(exif).to_string()),
            Tag::DateTimeOriginal => {
                if let exif::Value::Ascii(ref v) = field.value {
                    if let Some(v) = v.first() {
                        date_time = match time::PrimitiveDateTime::parse(
                            &String::from_utf8_lossy(v),
                            format_description!("[year]:[month]:[day] [hour]:[minute]:[second]"),
                        ) {
                            Ok(t) => Some(t),
                            Err(_) => None,
                        }
                    }
                }
            }
            Tag::GPSLatitude => {
                if let exif::Value::Rational(ref v) = field.value {
                    if v.len() >= 3 {
                        let d = v[0].num as f64 / v[0].denom as f64;
                        let m = v[1].num as f64 / v[1].denom as f64;
                        let s = v[2].num as f64 / v[2].denom as f64;
                        latitude = Some(d + m / 60.0 + s / 3600.0);
                    } else if let Some(v) = v.first() {
                        latitude = Some(v.num as f64 / v.denom as f64);
                    }
                }
            }
            Tag::GPSLongitude => {
                if let exif::Value::Rational(ref v) = field.value {
                    if v.len() >= 3 {
                        let d = v[0].num as f64 / v[0].denom as f64;
                        let m = v[1].num as f64 / v[1].denom as f64;
                        let s = v[2].num as f64 / v[2].denom as f64;
                        longitude = Some(d + m / 60.0 + s / 3600.0);
                    } else if let Some(v) = v.first() {
                        longitude = Some(v.num as f64 / v.denom as f64);
                    }
                }
            }
            Tag::GPSLatitudeRef => {
                if let exif::Value::Ascii(ref v) = field.value {
                    if let Some(v) = v.first() {
                        if !v.is_empty() {
                            latitude_sign = if v[0] == b'S' { -1.0 } else { 1.0 };
                        }
                    }
                }
            }
            Tag::GPSLongitudeRef => {
                if let exif::Value::Ascii(ref v) = field.value {
                    if let Some(v) = v.first() {
                        if !v.is_empty() {
                            longitude_sign = if v[0] == b'W' { -1.0 } else { 1.0 };
                        }
                    }
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
        make,
        model,
        lens_model,
        aperture,
        shutter_speed,
        iso,
        focal_length,
    }
}
