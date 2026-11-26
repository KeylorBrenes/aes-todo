use std::collections::BTreeMap;

use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Serialize;

use crate::domain::account::FieldErrors;

/// Error uniforme de la API: `{"error":{"code","message"}}`, con `fields` solo en
/// `validation_failed`.
pub struct ApiError {
    status: StatusCode,
    code: &'static str,
    message: String,
    fields: Option<BTreeMap<&'static str, &'static str>>,
}

#[derive(Serialize)]
struct ErrorBody {
    error: ErrorDetail,
}

#[derive(Serialize)]
struct ErrorDetail {
    code: &'static str,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    fields: Option<BTreeMap<&'static str, &'static str>>,
}

impl ApiError {
    fn new(status: StatusCode, code: &'static str, message: impl Into<String>) -> Self {
        Self {
            status,
            code,
            message: message.into(),
            fields: None,
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(StatusCode::NOT_FOUND, "not_found", message)
    }

    pub fn database_unavailable(message: impl Into<String>) -> Self {
        Self::new(
            StatusCode::SERVICE_UNAVAILABLE,
            "database_unavailable",
            message,
        )
    }

    pub fn method_not_allowed(message: impl Into<String>) -> Self {
        Self::new(
            StatusCode::METHOD_NOT_ALLOWED,
            "method_not_allowed",
            message,
        )
    }

    /// 400 con `fields` solo para los campos que fallaron.
    pub fn validation_failed(errors: &FieldErrors) -> Self {
        let fields = [("username", errors.username), ("password", errors.password)]
            .into_iter()
            .filter_map(|(field, code)| code.map(|code| (field, code)))
            .collect();

        Self {
            fields: Some(fields),
            ..Self::new(
                StatusCode::BAD_REQUEST,
                "validation_failed",
                "Los datos no son válidos",
            )
        }
    }

    pub fn invalid_body() -> Self {
        Self::new(
            StatusCode::BAD_REQUEST,
            "invalid_body",
            "El cuerpo de la petición no es válido",
        )
    }

    pub fn account_exists() -> Self {
        Self::new(
            StatusCode::CONFLICT,
            "account_exists",
            "La cuenta ya está creada",
        )
    }

    pub fn internal() -> Self {
        Self::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            "internal",
            "Error interno del servidor",
        )
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let body = ErrorBody {
            error: ErrorDetail {
                code: self.code,
                message: self.message,
                fields: self.fields,
            },
        };

        (self.status, Json(body)).into_response()
    }
}
