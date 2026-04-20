use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("database error: {0}")]
    Database(sqlx::Error),

    #[error("validation error: {0}")]
    Validation(String),

    /// Duplicate idempotency key — a concurrent request already committed this record.
    #[error("idempotency key already used")]
    UniqueViolation,

    #[error("internal error: {0}")]
    Internal(String),
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        // Intercept PostgreSQL unique-violation (23505) and surface as a typed variant
        // so the handler can recover it without string-matching.
        if let sqlx::Error::Database(ref db_err) = err {
            if db_err.code().as_deref() == Some("23505") {
                return AppError::UniqueViolation;
            }
        }
        AppError::Database(err)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::Database(e) => {
                tracing::error!("database error: {e}");
                (StatusCode::INTERNAL_SERVER_ERROR, "internal server error".to_string())
            }
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::UniqueViolation => (StatusCode::CONFLICT, "conflict".to_string()),
            AppError::Internal(msg) => {
                tracing::error!("internal error: {msg}");
                (StatusCode::INTERNAL_SERVER_ERROR, "internal server error".to_string())
            }
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}
