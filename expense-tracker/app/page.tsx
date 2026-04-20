"use client";

import { useCallback, useEffect, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import { listExpenses } from "@/lib/api";
import { formatCents } from "@/lib/money";
import type { Expense, SortOrder } from "@/types/expense";

function topCategory(expenses: Expense[]): string {
  if (expenses.length === 0) return "—";
  const totals: Record<string, number> = {};
  for (const e of expenses) totals[e.category] = (totals[e.category] ?? 0) + e.amount;
  return Object.entries(totals).sort(([, a], [, b]) => b - a)[0][0];
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-white/60 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-white tabular-nums truncate">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/50">{sub}</p>}
    </div>
  );
}

export default function HomePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortOrder>("date_desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listExpenses({
        category:  category  || undefined,
        sort,
        date_from: dateFrom  || undefined,
        date_to:   dateTo    || undefined,
      });
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  }, [category, sort, dateFrom, dateTo]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const top = topCategory(expenses);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-20">
          {/* Branding */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-lg shadow-inner">
              💳
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">
                Expense Tracker
              </h1>
              <p className="text-xs text-white/50 mt-0.5">
                Personal finance, simplified
              </p>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Total Spent"
              value={formatCents(total)}
              sub={category ? `filtered · ${category}` : "all categories"}
            />
            <StatCard
              label="Expenses"
              value={String(expenses.length)}
              sub={expenses.length === 1 ? "entry" : "entries"}
            />
            <StatCard
              label="Top Category"
              value={top}
            />
          </div>
        </div>
      </div>

      {/* ── Main content (pulled up into the header) ─────────────────── */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-10 pb-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ExpenseForm onExpenseAdded={() => fetchExpenses()} />
          </div>

          <div className="lg:col-span-2">
            <ExpenseList
              expenses={expenses}
              isLoading={isLoading}
              error={error}
              category={category}
              sort={sort}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onCategoryChange={setCategory}
              onSortChange={setSort}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
