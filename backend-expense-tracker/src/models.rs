use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Expense {
    pub id: Uuid,
    pub amount: i64,
    pub category: String,
    pub description: Option<String>,
    pub date: NaiveDate,
    pub idempotency_key: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateExpenseRequest {
    pub amount: i64,
    pub category: String,
    pub description: Option<String>,
    pub date: NaiveDate,
}

#[derive(Debug, Deserialize)]
pub struct ListExpensesQuery {
    pub category: Option<String>,
    pub sort: Option<SortOrder>,
}

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum SortOrder {
    #[default]
    DateDesc,
    DateAsc,
}

#[derive(Debug, Serialize)]
pub struct ListExpensesResponse {
    pub expenses: Vec<Expense>,
}
