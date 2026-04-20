"use client";

import { formatCents } from "@/lib/money";
import { CATEGORIES, categoryStyle } from "@/lib/categories";
import type { Expense, SortOrder } from "@/types/expense";

function formatDate(iso: string): string {
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
  dateFrom: string;
  dateTo: string;
  onCategoryChange: (cat: string) => void;
  onSortChange: (sort: SortOrder) => void;
  onDateFromChange: (d: string) => void;
  onDateToChange: (d: string) => void;
}

export default function ExpenseList({
  expenses,
  isLoading,
  error,
  category,
  sort,
  dateFrom,
  dateTo,
  onCategoryChange,
  onSortChange,
  onDateFromChange,
  onDateToChange,
}: Props) {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const hasDateFilter = !!(dateFrom || dateTo);
  const hasAnyFilter = !!(category || hasDateFilter);

  return (
    <div className="flex flex-col gap-4">
      {/* ── Filters card ───────────────────────────────────────── */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 px-5 py-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Filter by Category</h2>
          <button
            onClick={() => onSortChange(sort === "date_desc" ? "date_asc" : "date_desc")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95"
          >
            {sort === "date_desc" ? (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 15m0 0l3.75-3.75M17.25 15V6.75" />
                </svg>
                Newest first
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21l3.75-3.75" />
                </svg>
                Oldest first
              </>
            )}
          </button>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange("")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
              ${category === ""
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => {
            const s = categoryStyle(cat);
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(active ? "" : cat)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1
                  ${active ? `${s.activePill} shadow-sm` : `${s.badge} hover:opacity-80`}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Date range */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span className="text-xs font-medium text-slate-500">Date range</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-colors"
              />
              <span className="text-xs text-slate-400 font-medium">→</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => onDateToChange(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 transition-colors"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { onDateFromChange(""); onDateToChange(""); }}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Expense list card ────────────────────────────────────── */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 overflow-hidden">
        {/* Summary bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            {hasAnyFilter && (
              <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-500 normal-case font-medium">
                filtered
              </span>
            )}
          </span>
          <span className="text-sm font-bold text-slate-800 tabular-nums">
            {formatCents(total)}
          </span>
        </div>

        {/* Rows */}
        <div className="expense-scroll divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
          {isLoading ? (
            <LoadingRows />
          ) : error ? (
            <ErrorState message={error} />
          ) : expenses.length === 0 ? (
            <EmptyState filtered={hasAnyFilter} />
          ) : (
            expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} />
            ))
          )}
        </div>

        {/* Category breakdown */}
        {expenses.length > 0 && !isLoading && (
          <CategoryBreakdown expenses={expenses} total={total} />
        )}
      </div>
    </div>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const s = categoryStyle(expense.category);
  return (
    <div className={`flex items-center gap-4 pl-5 pr-6 py-3.5 transition-colors hover:bg-slate-50/80 border-l-4 ${s.border}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>
            {expense.category}
          </span>
          <time className="text-xs text-slate-400">{formatDate(expense.date)}</time>
        </div>
        {expense.description ? (
          <p className="text-sm text-slate-600 truncate">{expense.description}</p>
        ) : (
          <p className="text-xs text-slate-300 italic">No description</p>
        )}
      </div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-slate-800">
        {formatCents(expense.amount)}
      </span>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-0">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 last:border-0">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-3 w-40 rounded-full bg-slate-100 animate-pulse" />
          </div>
          <div className="h-4 w-16 rounded-full bg-slate-100 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-700">Something went wrong</p>
      <p className="text-xs text-slate-400">{message}</p>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
        {filtered ? "🔍" : "💸"}
      </div>
      <p className="text-sm font-semibold text-slate-700">
        {filtered ? "No expenses in this category" : "No expenses yet"}
      </p>
      <p className="text-xs text-slate-400">
        {filtered ? "Try selecting a different filter" : "Add your first expense using the form"}
      </p>
    </div>
  );
}

function CategoryBreakdown({
  expenses,
  total,
}: {
  expenses: Expense[];
  total: number;
}) {
  const totals = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const sorted = Object.entries(totals).sort(([, a], [, b]) => b - a);

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Breakdown
      </p>
      <div className="space-y-3.5">
        {sorted.map(([cat, amount]) => {
          const pct = total > 0 ? (amount / total) * 100 : 0;
          const s = categoryStyle(cat);
          return (
            <div key={cat}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  <span className="text-sm font-medium text-slate-700">{cat}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{pct.toFixed(0)}%</span>
                  <span className="text-sm font-semibold tabular-nums text-slate-800">
                    {formatCents(amount)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`progress-bar h-full rounded-full ${s.bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
