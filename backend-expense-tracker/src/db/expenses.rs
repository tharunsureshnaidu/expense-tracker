use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    error::AppError,
    models::{CreateExpenseRequest, Expense, SortOrder},
};

pub async fn find_by_idempotency_key(
    pool: &PgPool,
    key: &str,
) -> Result<Option<Expense>, AppError> {
    sqlx::query_as::<_, Expense>(
        "SELECT id, amount, category, description, date, idempotency_key, created_at
         FROM expenses
         WHERE idempotency_key = $1",
    )
    .bind(key)
    .fetch_optional(pool)
    .await
    .map_err(AppError::from)
}

pub async fn create(
    pool: &PgPool,
    req: &CreateExpenseRequest,
    idempotency_key: Option<&str>,
) -> Result<Expense, AppError> {
    let id = Uuid::new_v4();

    sqlx::query_as::<_, Expense>(
        "INSERT INTO expenses (id, amount, category, description, date, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, amount, category, description, date, idempotency_key, created_at",
    )
    .bind(id)
    .bind(req.amount)
    .bind(req.category.as_str())
    .bind(req.description.as_deref())
    .bind(req.date)
    .bind(idempotency_key)
    .fetch_one(pool)
    .await
    .map_err(AppError::from)
}

pub async fn list(
    pool: &PgPool,
    category: Option<&str>,
    sort: &SortOrder,
) -> Result<Vec<Expense>, AppError> {
    // order_clause is derived from our own enum — not user input — safe to interpolate.
    let order_clause = match sort {
        SortOrder::DateDesc => "date DESC, created_at DESC",
        SortOrder::DateAsc => "date ASC, created_at ASC",
    };

    let expenses = if let Some(cat) = category {
        let sql = format!(
            "SELECT id, amount, category, description, date, idempotency_key, created_at
             FROM expenses
             WHERE category = $1
             ORDER BY {order_clause}"
        );
        sqlx::query_as::<_, Expense>(&sql)
            .bind(cat)
            .fetch_all(pool)
            .await?
    } else {
        let sql = format!(
            "SELECT id, amount, category, description, date, idempotency_key, created_at
             FROM expenses
             ORDER BY {order_clause}"
        );
        sqlx::query_as::<_, Expense>(&sql)
            .fetch_all(pool)
            .await?
    };

    Ok(expenses)
}
