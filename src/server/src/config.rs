use std::env;
use std::path::PathBuf;

const DEFAULT_DATABASE_URL: &str = "sqlite:aes-todo.db";
const DEFAULT_APP_ADDR: &str = "127.0.0.1:5080";
const DEFAULT_WEB_DIST: &str = "src/web/dist";

/// Configuración del servidor, leída una sola vez desde el entorno en `main`.
pub struct Config {
    pub database_url: String,
    pub app_addr: String,
    pub web_dist: PathBuf,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| DEFAULT_DATABASE_URL.to_string()),
            app_addr: env::var("APP_ADDR").unwrap_or_else(|_| DEFAULT_APP_ADDR.to_string()),
            web_dist: env::var("WEB_DIST")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from(DEFAULT_WEB_DIST)),
        }
    }
}
