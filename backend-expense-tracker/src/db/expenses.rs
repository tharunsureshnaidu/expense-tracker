use chrono::NaiveDate;
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
    date_from: Option<NaiveDate>,
    date_to: Option<NaiveDate>,
    sort: &SortOrder,
) -> Result<Vec<Expense>, AppError> {
    // All clauses come from our own enum/args — not raw user strings — safe to interpolate.
    let order_clause = match sort {
        SortOrder::DateDesc => "date DESC, created_at DESC",
        SortOrder::DateAsc => "date ASC, created_at ASC",
    };

    // Build WHERE dynamically; track $N index as conditions are added.
    let mut conditions: Vec<String> = Vec::new();
    let mut idx: usize = 1;

    if category.is_some() {
        conditions.push(format!("category = ${idx}"));
        idx += 1;
    }
    if date_from.is_some() {
        conditions.push(format!("date >= ${idx}"));
        idx += 1;
    }
    if date_to.is_some() {
        conditions.push(format!("date <= ${idx}"));
        idx += 1;
    }
    let _ = idx;

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    let sql = format!(
        "SELECT id, amount, category, description, date, idempotency_key, created_at
         FROM expenses {where_clause} ORDER BY {order_clause}"
    );

    let mut query = sqlx::query_as::<_, Expense>(&sql);
    if let Some(cat) = category {
        query = query.bind(cat);
    }
    if let Some(from) = date_from {
        query = query.bind(from);
    }
    if let Some(to) = date_to {
        query = query.bind(to);
    }

    query.fetch_all(pool).await.map_err(AppError::from)
}
