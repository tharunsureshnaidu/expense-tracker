use axum::{
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
    Json,
};
use sqlx::PgPool;

use crate::{
    db,
    error::AppError,
    models::{CreateExpenseRequest, Expense, ListExpensesQuery, ListExpensesResponse, SortOrder},
};

pub async fn create_expense(
    State(pool): State<PgPool>,
    headers: HeaderMap,
    Json(req): Json<CreateExpenseRequest>,
) -> Result<(StatusCode, Json<Expense>), AppError> {
    if req.amount <= 0 {
        return Err(AppError::Validation(
            "amount must be greater than 0".to_string(),
        ));
    }
    if req.category.trim().is_empty() {
        return Err(AppError::Validation("category is required".to_string()));
    }

    let idempotency_key: Option<String> = headers
        .get("Idempotency-Key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_owned());

    // Fast path: key already committed — return the existing record immediately.
    if let Some(ref key) = idempotency_key {
        if let Some(existing) = db::expenses::find_by_idempotency_key(&pool, key).await? {
            return Ok((StatusCode::OK, Json(existing)));
        }
    }

    // Attempt insert. Handle the rare concurrent-request race by catching the
    // unique-constraint violation and fetching the winner's record.
    match db::expenses::create(&pool, &req, idempotency_key.as_deref()).await {
        Ok(expense) => Ok((StatusCode::CREATED, Json(expense))),

        Err(AppError::UniqueViolation) => {
            // Another concurrent request with the same key committed first.
            match idempotency_key.as_deref() {
                Some(key) => {
                    let existing = db::expenses::find_by_idempotency_key(&pool, key)
                        .await?
                        .ok_or_else(|| {
                            AppError::Internal(
                                "unique violation but record not found".to_string(),
                            )
                        })?;
                    Ok((StatusCode::OK, Json(existing)))
                }
                None => Err(AppError::Internal(
                    "unique violation without idempotency key".to_string(),
                )),
            }
        }

        Err(e) => Err(e),
    }
}

pub async fn list_expenses(
    State(pool): State<PgPool>,
    Query(params): Query<ListExpensesQuery>,
) -> Result<Json<ListExpensesResponse>, AppError> {
    let sort = params.sort.unwrap_or(SortOrder::DateDesc);
    let expenses = db::expenses::list(
        &pool,
        params.category.as_deref(),
        params.date_from,
        params.date_to,
        &sort,
    )
    .await?;
    Ok(Json(ListExpensesResponse { expenses }))
}
