"use client";

import { useRef, useState } from "react";
import { createExpense } from "@/lib/api";
import { dollarsToCents } from "@/lib/money";
import type { Expense } from "@/types/expense";

const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Health",
  "Housing",
  "Shopping",
  "Other",
];

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

interface FormState {
  amount: string;
  category: string;
  description: string;
  date: string;
}

interface Props {
  onExpenseAdded: (expense: Expense) => void;
}

export default function ExpenseForm({ onExpenseAdded }: Props) {
  // One UUID per submission intent. Regenerated only after success so that
  // retries of the same form data are idempotent.
  const idempotencyKey = useRef(crypto.randomUUID());

  const [form, setForm] = useState<FormState>({
    amount: "",
    category: CATEGORIES[0],
    description: "",
    date: todayISO(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const amountCents = dollarsToCents(form.amount);
    if (amountCents <= 0) {
      setError("Amount must be greater than $0.00");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const expense = await createExpense(
        {
          amount: amountCents,
          category: form.category,
          description: form.description.trim() || undefined,
          date: form.date,
        },
        idempotencyKey.current,
      );

      // Successful commit: rotate the key so the next expense gets a fresh one.
      idempotencyKey.current = crypto.randomUUID();
      setForm({ amount: "", category: CATEGORIES[0], description: "", date: todayISO() });
      onExpenseAdded(expense);
    } catch (err) {
      // Keep the same key — retrying with identical data must not create a duplicate.
      setError(err instanceof Error ? err.message : "Failed to add expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">Add Expense</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Amount ($)
          </label>
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What was this for?"
            maxLength={255}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Adding…" : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
