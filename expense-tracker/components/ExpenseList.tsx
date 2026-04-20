"use client";

import { formatCents } from "@/lib/money";
import type { Expense, SortOrder } from "@/types/expense";

const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Health",
  "Housing",
  "Shopping",
  "Other",
];

function formatDate(iso: string): string {
  // Append time to parse as local date, avoiding UTC-midnight timezone shifts.
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  category: string;
  sort: SortOrder;
  onCategoryChange: (cat: string) => void;
  onSortChange: (sort: SortOrder) => void;
}

export default function ExpenseList({
  expenses,
  isLoading,
  error,
  category,
  sort,
  onCategoryChange,
  onSortChange,
}: Props) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Filters */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              onClick={() =>
                onSortChange(sort === "date_desc" ? "date_asc" : "date_desc")
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {sort === "date_desc" ? (
                <>&#8595; Newest first</>
              ) : (
                <>&#8593; Oldest first</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
        <p className="text-sm text-gray-600">
          Total:{" "}
          <span className="text-base font-semibold text-gray-900">
            {formatCents(total)}
          </span>
          <span className="ml-2 text-gray-400">
            ({expenses.length} expense{expenses.length !== 1 ? "s" : ""})
          </span>
        </p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            Loading…
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center text-sm text-red-600">
            {error}
          </div>
        ) : expenses.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No expenses yet. Add one to get started.
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-start justify-between gap-4 px-6 py-4"
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    {expense.category}
                  </span>
                  <time className="text-xs text-gray-400">
                    {formatDate(expense.date)}
                  </time>
                </div>
                {expense.description && (
                  <p className="truncate text-sm text-gray-600">
                    {expense.description}
                  </p>
                )}
              </div>

              <span className="shrink-0 font-semibold tabular-nums text-gray-900">
                {formatCents(expense.amount)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Per-category breakdown — only shown when there are expenses */}
      {expenses.length > 0 && <CategoryBreakdown expenses={expenses} />}
    </div>
  );
}

function CategoryBreakdown({ expenses }: { expenses: Expense[] }) {
  const totals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        By Category
      </p>
      <div className="space-y-1">
        {sorted.map(([cat, amount]) => (
          <div key={cat} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{cat}</span>
            <span className="text-sm font-medium tabular-nums text-gray-900">
              {formatCents(amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
