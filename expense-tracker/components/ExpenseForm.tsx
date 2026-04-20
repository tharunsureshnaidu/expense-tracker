"use client";

import { useRef, useState } from "react";
import { createExpense } from "@/lib/api";
import { dollarsToCents } from "@/lib/money";
import { CATEGORIES, categoryStyle } from "@/lib/categories";
import type { Expense } from "@/types/expense";

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

function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
    >
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300";

export default function ExpenseForm({ onExpenseAdded }: Props) {
  const idempotencyKey = useRef(crypto.randomUUID());

  const [form, setForm] = useState<FormState>({
    amount: "",
    category: CATEGORIES[0],
    description: "",
    date: todayISO(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const amountCents = dollarsToCents(form.amount);
    if (amountCents <= 0) {
      setError("Enter an amount greater than $0.00");
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

      idempotencyKey.current = crypto.randomUUID();
      setForm({ amount: "", category: CATEGORIES[0], description: "", date: todayISO() });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      onExpenseAdded(expense);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const catStyle = categoryStyle(form.category);

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 overflow-hidden">
      {/* Card header */}
      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800">New Expense</h2>
        <p className="text-xs text-slate-400 mt-0.5">Fill in the details below</p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {/* Amount */}
        <div>
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 select-none">
              $
            </span>
            <input
              id="amount"
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <Label htmlFor="category">Category</Label>
          <div className="relative">
            <span
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ${catStyle.dot}`}
            />
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className={`${inputCls} pl-8 appearance-none cursor-pointer`}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {/* chevron */}
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">
            Description{" "}
            <span className="font-normal normal-case text-slate-400">(optional)</span>
          </Label>
          <input
            id="description"
            type="text"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What was this for?"
            maxLength={255}
            className={inputCls}
          />
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="date">Date</Label>
          <input
            id="date"
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className={inputCls}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`relative w-full overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60
            ${success
              ? "bg-emerald-500"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99]"
            }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Adding…
            </span>
          ) : success ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Added!
            </span>
          ) : (
            "Add Expense"
          )}
        </button>
      </form>
    </div>
  );
}
