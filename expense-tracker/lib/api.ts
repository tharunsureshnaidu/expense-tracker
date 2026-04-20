import type {
  CreateExpensePayload,
  Expense,
  ListExpensesParams,
} from "@/types/expense";

function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_URL is not set");
  return `${base}${path}`;
}

export async function createExpense(
  payload: CreateExpensePayload,
  idempotencyKey: string,
): Promise<Expense> {
  const res = await fetch(apiUrl("/expenses"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "request failed" }));
    throw new Error(body.error ?? "request failed");
  }

  return res.json();
}

export async function listExpenses(
  params: ListExpensesParams = {},
): Promise<Expense[]> {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.sort) qs.set("sort", params.sort);
  if (params.date_from) qs.set("date_from", params.date_from);
  if (params.date_to) qs.set("date_to", params.date_to);

  const search = qs.toString();
  const url = apiUrl(`/expenses${search ? `?${search}` : ""}`);
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) throw new Error("failed to fetch expenses");

  const data = await res.json();
  return data.expenses as Expense[];
}
