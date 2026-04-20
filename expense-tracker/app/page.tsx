"use client";

import { useCallback, useEffect, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import { listExpenses } from "@/lib/api";
import type { Expense, SortOrder } from "@/types/expense";

export default function HomePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortOrder>("date_desc");

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listExpenses({
        category: category || undefined,
        sort,
      });
      setExpenses(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load expenses",
      );
    } finally {
      setIsLoading(false);
    }
  }, [category, sort]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // After a successful submission, re-fetch so the list reflects the real
  // server order (respects current sort + filter).
  function handleExpenseAdded(_expense: Expense) {
    fetchExpenses();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-xl font-bold text-gray-900">Expense Tracker</h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ExpenseForm onExpenseAdded={handleExpenseAdded} />
          </div>

          <div className="lg:col-span-2">
            <ExpenseList
              expenses={expenses}
              isLoading={isLoading}
              error={error}
              category={category}
              sort={sort}
              onCategoryChange={setCategory}
              onSortChange={setSort}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
