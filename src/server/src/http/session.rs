use axum::Json;
use axum::extract::State;
use axum::http::HeaderMap;
use serde::Serialize;

use super::AppState;
use super::error::ApiError;
use super::session_cookie;
use crate::store::account;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionBody {
    account_exists: bool,
    username: Option<String>,
}

/// `GET /api/session`: si la cuenta existe y quién tiene sesión en este navegador.
pub(crate) async fn get_session(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<SessionBody>, ApiError> {
    let exists = account::account_exists(&state.pool)
        .await
        .map_err(database_unavailable)?;

    let username = match session_cookie::read(&headers) {
        Some(token) if exists => account::session_username(&state.pool, &token.hash())
            .await
            .map_err(database_unavailable)?,
        _ => None,
    };

    Ok(Json(SessionBody {
        account_exists: exists,
        username,
    }))
}

fn database_unavailable(error: sqlx::Error) -> ApiError {
    tracing::error!(%error, "no se pudo consultar la sesión");
    ApiError::database_unavailable("La base de datos no responde")
}
