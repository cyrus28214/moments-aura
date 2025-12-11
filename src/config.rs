use serde::Deserialize;
use std::{borrow::Cow, env, fs, path::Path};

#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub address: String,
    pub storage_dir: String,

    pub database_url: String,
    pub jwt_secret: String,
    pub ai: AiConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AiConfig {
    pub enable: bool,
    pub model: String,
    pub base_url: String,
    pub api_key: String,
}

impl AppConfig {
    pub fn new(toml_path: &Path) -> Self {
        tracing::info!("Loading config from file: {}", toml_path.display());
        let config_content = fs::read_to_string(toml_path)
            .unwrap_or_else(|_| panic!("Failed to read config file at {:?}", toml_path));
        let processed_content = Self::expand_env_vars(&config_content);
        let config: AppConfig = toml::from_str(&processed_content)
            .expect("Failed to parse config file after env injection");

        config
    }

    /// 手动解析并替换 {{ $VAR }}
    fn expand_env_vars(input: &'_ str) -> Cow<'_, str> {
        if !input.contains("{{") {
            return Cow::Borrowed(input);
        }

        let mut result = String::with_capacity(input.len());
        let mut last_pos = 0;

        // 循环查找 "{{"
        while let Some(start_offset) = input[last_pos..].find("{{") {
            // 计算 "{{" 在整个字符串中的绝对位置
            let abs_start = last_pos + start_offset;

            // 将 "{{" 之前的内容原样追加到结果中
            result.push_str(&input[last_pos..abs_start]);

            // 从 "{{" 之后查找配对的 "}}"
            // abs_start + 2 跳过 "{{"
            if let Some(end_offset) = input[abs_start + 2..].find("}}") {
                let abs_end = abs_start + 2 + end_offset;

                // 提取中间的内容，例如 " $DATABASE_URL "
                let variable_section = &input[abs_start + 2..abs_end];
                let var_name_clean = variable_section.trim(); // 去除首尾空格

                // 检查是否以 '$' 开头 (符合 {{ $VAR }} 规范)
                if let Some(env_key) = var_name_clean.strip_prefix('$') {
                    // 查找环境变量
                    match env::var(env_key) {
                        Ok(val) => result.push_str(&val),
                        Err(_) => {
                            tracing::warn!("Env var {} not found, using empty string", env_key);
                            // 没找到时不追加任何内容，即替换为空字符串
                        }
                    }
                } else {
                    // 如果不是以 $ 开头（例如 {{ 123 }}），可能不是我们要处理的格式
                    // 保持原样或者报错，这里选择保持原样输出，方便调试
                    result.push_str("{{");
                    result.push_str(variable_section);
                    result.push_str("}}");
                }

                // 更新游标位置到 "}}" 之后
                last_pos = abs_end + 2;
            } else {
                // 找到了 "{{" 但没找到 "}}"，说明格式错误或只是普通文本
                // 将 "{{" 追加进去，继续往后找
                result.push_str("{{");
                last_pos = abs_start + 2;
            }
        }

        // 将剩余的字符串追加到结果中
        result.push_str(&input[last_pos..]);

        Cow::Owned(result)
    }
}
