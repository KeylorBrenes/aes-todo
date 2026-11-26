use axum::Json;
use axum::extract::State;
use axum::extract::rejection::JsonRejection;
use axum::http::{StatusCode, header};
use serde::{Deserialize, Serialize};

use super::AppState;
use super::error::ApiError;
use super::session_cookie;
use crate::domain::account::{self, hash_password};
use crate::domain::session::SessionToken;
use crate::store::account::{CreateAccountError, create_with_session};

#[derive(Deserialize)]
pub(crate) struct CreateAccountBody {
    username: String,
    password: String,
}

#[derive(Serialize)]
pub(crate) struct CreatedAccountBody {
    username: String,
}

type Created = (
    StatusCode,
    [(header::HeaderName, String); 1],
    Json<CreatedAccountBody>,
);

/// `POST /api/account`: crea la única cuenta y deja al dueño con sesión.
pub(crate) async fn create_account(
    State(state): State<AppState>,
    body: Result<Json<CreateAccountBody>, JsonRejection>,
) -> Result<Created, ApiError> {
    let Json(body) = body.map_err(|_| ApiError::invalid_body())?;
    let (username, password) = account::validate(&body.username, &body.password)
        .map_err(|errors| ApiError::validation_failed(&errors))?;

    let password_hash = tokio::task::spawn_blocking(move || hash_password(&password))
        .await
        .map_err(|error| {
            tracing::error!(%error, "falló la tarea que calcula el hash de la contraseña");
            ApiError::internal()
        })?
        .map_err(|error| {
            tracing::error!(%error, "no se pudo calcular el hash de la contraseña");
            ApiError::internal()
        })?;

    let token = SessionToken::generate().map_err(|error| {
        tracing::error!(%error, "no se pudo generar el token de sesión");
        ApiError::internal()
    })?;

    create_with_session(&state.pool, &username, &password_hash, &token.hash())
        .await
        .map_err(|error| match error {
            CreateAccountError::AccountExists => ApiError::account_exists(),
            CreateAccountError::Database(error) => {
                tracing::error!(%error, "no se pudo crear la cuenta");
                ApiError::database_unavailable("La base de datos no responde")
            }
        })?;

    Ok((
        StatusCode::CREATED,
        [(header::SET_COOKIE, session_cookie::set_cookie(&token))],
        Json(CreatedAccountBody {
            username: username.as_str().to_string(),
        }),
    ))
}
