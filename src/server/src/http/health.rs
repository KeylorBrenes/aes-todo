use axum::Json;
use axum::extract::State;
use serde::Serialize;

use super::AppState;
use super::error::ApiError;
use crate::store;

#[derive(Serialize)]
pub(crate) struct HealthBody {
    status: &'static str,
}

pub(crate) async fn health(State(state): State<AppState>) -> Result<Json<HealthBody>, ApiError> {
    match store::ping(&state.pool).await {
        Ok(()) => Ok(Json(HealthBody { status: "ok" })),
        Err(error) => {
            tracing::error!(%error, "la base de datos no responde");
            Err(ApiError::database_unavailable(
                "La base de datos no responde",
            ))
        }
    }
}
