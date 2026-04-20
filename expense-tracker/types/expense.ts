export interface Expense {
  id: string;
  amount: number; // cents
  category: string;
  description?: string;
  date: string; // "YYYY-MM-DD"
  idempotency_key?: string;
  created_at: string;
}

export type SortOrder = "date_asc" | "date_desc";

export interface CreateExpensePayload {
  amount: number; // cents
  category: string;
  description?: string;
  date: string; // "YYYY-MM-DD"
}

export interface ListExpensesParams {
  category?: string;
  sort?: SortOrder;
  date_from?: string; // "YYYY-MM-DD"
  date_to?: string;   // "YYYY-MM-DD"
}
