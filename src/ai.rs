use crate::config::AiConfig;
use base64::Engine;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct AiService {
    client: Client,
    config: AiConfig,
}

#[derive(Serialize)]
struct ChatCompletionRequest {
    model: String,
    messages: Vec<Message>,
}

#[derive(Serialize)]
struct Message {
    role: String,
    content: Vec<Content>,
}

#[derive(Serialize)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
enum Content {
    Text { text: String },
    ImageUrl { image_url: ImageUrl },
}

#[derive(Serialize)]
struct ImageUrl {
    url: String,
}

#[derive(Deserialize)]
struct ChatCompletionResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: MessageResponse,
}

#[derive(Deserialize)]
struct MessageResponse {
    content: String,
}

impl AiService {
    pub fn new(config: AiConfig) -> Self {
        Self {
            client: Client::new(),
            config,
        }
    }

    pub async fn recommend_tags(
        &self,
        image_data: &[u8],
        mime_type: &str,
    ) -> Result<Vec<String>, String> {
        if !self.config.enable {
            return Err("AI service is disabled".to_string());
        }

        let base64_image = base64::engine::general_purpose::STANDARD.encode(image_data);
        let data_url = format!("data:{};base64,{}", mime_type, base64_image);

        let request = ChatCompletionRequest {
            model: self.config.model.clone(),
            messages: Vec::from([Message {
                role: "user".to_string(),
                content: Vec::from([
                    Content::Text {
                        text: "Analyze this image and provide a list of relevant tags. Return ONLY the tags as a JSON array of strings, for example: [\"nature\", \"sunset\", \"mountain\"]. Do not include markdown formatting or any other text.".to_string(),
                    },
                    Content::ImageUrl {
                        image_url: ImageUrl { url: data_url },
                    },
                ]),
            }]),
        };

        let response = self
            .client
            .post(&self.config.base_url)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .json(&request)
            .send()
            .await
            .map_err(|e| format!("Request failed: {}", e))?;

        if !response.status().is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            return Err(format!("API error: {}", error_text));
        }

        let response_data: ChatCompletionResponse = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let content = response_data
            .choices
            .first()
            .ok_or("No choices returned")?
            .message
            .content
            .trim();

        // Clean up markdown code blocks if present (e.g. ```json ... ```)
        let clean_content = if content.starts_with("```") {
            content
                .lines()
                .filter(|line| !line.trim().starts_with("```"))
                .collect::<Vec<_>>()
                .join("\n")
        } else {
            content.to_string()
        };

        let tags: Vec<String> = serde_json::from_str(&clean_content)
            .map_err(|e| format!("Failed to parse tags JSON: {} from content: {}", e, content))?;

        Ok(tags)
    }
}
