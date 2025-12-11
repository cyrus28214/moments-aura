use moments_aura::{ai::AiService, config::AppConfig};
use std::{env, fs, path::Path};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Load Config
    // Assumption: config.toml is in the current directory where the example is run
    let config_path = Path::new("config.toml");
    if !config_path.exists() {
        eprintln!("Error: config.toml not found in current directory.");
        std::process::exit(1);
    }
    let config = AppConfig::new(config_path);

    // 2. Parse Arguments
    let args: Vec<String> = env::args().collect();
    if args.len() != 2 {
        eprintln!("Usage: cargo run --example test_ai_tags <path_to_image>");
        std::process::exit(1);
    }
    let image_path = Path::new(&args[1]);

    if !image_path.exists() {
        eprintln!("Error: Image file not found: {}", image_path.display());
        std::process::exit(1);
    }

    // 3. Initialize AI Service
    let ai_service = AiService::new(config.ai);

    // 4. Read Image
    let image_data = fs::read(image_path)?;

    // 5. Determine MIME type (simple extension check)
    let extension = image_path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    let mime_type = match extension.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        _ => {
            eprintln!("Unsupported image extension: .{}", extension);
            std::process::exit(1);
        }
    };

    println!("Analyzing image: {} ({})", image_path.display(), mime_type);

    // 6. Call AI Service
    match ai_service.recommend_tags(&image_data, mime_type).await {
        Ok(tags) => {
            println!("Recommended Tags:");
            for tag in tags {
                println!("- {}", tag);
            }
        }
        Err(e) => {
            eprintln!("AI Analysis Failed: {}", e);
            std::process::exit(1);
        }
    }

    Ok(())
}
