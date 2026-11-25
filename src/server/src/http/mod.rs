mod error;
mod health;

use std::path::PathBuf;

use axum::Router;
use axum::routing::{any, get};
use sqlx::SqlitePool;
use tower_http::services::{ServeDir, ServeFile};

use self::error::ApiError;

/// Dependencias que comparten los handlers HTTP.
#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub web_dist: PathBuf,
}

/// Construye el router: `GET /api/health`, el 404 uniforme de `/api/*` y la web compilada.
pub fn app(state: AppState) -> Router {
    let index = state.web_dist.join("index.html");
    let assets = ServeDir::new(&state.web_dist).fallback(ServeFile::new(index));
    let api = Router::new()
        .route("/health", get(health::health))
        .fallback(api_not_found)
        .method_not_allowed_fallback(api_method_not_allowed);

    Router::new()
        // `nest` no cubre `/api/` (el comodín exige un resto no vacío).
        .route("/api/", any(api_not_found))
        .nest("/api", api)
        .fallback_service(assets)
        .with_state(state)
}

async fn api_not_found() -> ApiError {
    ApiError::not_found("La ruta solicitada no existe")
}

async fn api_method_not_allowed() -> ApiError {
    ApiError::method_not_allowed("El método no está permitido para esta ruta")
}
