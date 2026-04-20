use axum::{
    routing::{get, post},
    Router,
};
use sqlx::PgPool;
use tower_http::cors::{Any, CorsLayer};

use crate::handlers;

pub fn create_router(pool: PgPool) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/expenses", post(handlers::expenses::create_expense))
        .route("/expenses", get(handlers::expenses::list_expenses))
        .route("/health", get(|| async { "OK" }))
        .with_state(pool)
        .layer(cors)
}
