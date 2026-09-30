"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CATEGORY_ICONS,
  type ExpenseCategory,
} from "@/lib/expenses";
import { useExpenses } from "@/components/expenses/ExpenseProvider";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function RecentExpenses() {
  const { expenses } = useExpenses();

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      )
      .slice(0, 5);
  }, [expenses]);

  return (
    <article className="surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.02em]">
            Recent expenses
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your latest spending.
          </p>
        </div>

        <Link
          href="/expenses"
          className="text-xs font-semibold text-[var(--green)] hover:underline"
        >
          View all
        </Link>
      </div>

      {recentExpenses.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-semibold">
            No expenses yet
          </p>

          <p className="mt-1 text-xs text-[var(--text-light)]">
            Your spending will appear here after you add an expense.
          </p>

          <Link
            href="/expenses/new"
            className="mt-5 inline-flex text-sm font-semibold text-[var(--green)] hover:underline"
          >
            Add an expense →
          </Link>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-[var(--border)]">
          {recentExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-green)] text-base">
                  {
                    CATEGORY_ICONS[
                      expense.category as ExpenseCategory
                    ]
                  }
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {expense.description}
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-light)]">
                    {expense.category} ·{" "}
                    {formatDate(expense.date)}
                  </p>
                </div>
              </div>

              <p className="shrink-0 text-sm font-bold">
                ${formatAmount(expense.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}