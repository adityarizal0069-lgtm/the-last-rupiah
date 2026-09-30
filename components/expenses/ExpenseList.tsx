"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CATEGORY_ICONS,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/lib/expenses";
import { useExpenses } from "@/components/expenses/ExpenseProvider";
import EmptyState from "@/components/ui/EmptyState";

type SortOption =
  | "newest"
  | "oldest"
  | "highest"
  | "lowest";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function ExpenseList() {
  const { expenses, deleteExpense } = useExpenses();

  const [selectedCategory, setSelectedCategory] =
    useState<"All" | ExpenseCategory>("All");

  const [sortBy, setSortBy] =
    useState<SortOption>("newest");

  const [expenseToDelete, setExpenseToDelete] = useState<{
    id: string;
    description: string;
  } | null>(null);

  const filteredAndSortedExpenses = useMemo(() => {
    const filteredExpenses =
      selectedCategory === "All"
        ? expenses
        : expenses.filter(
            (expense) => expense.category === selectedCategory,
          );

    return [...filteredExpenses].sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.date).getTime() -
          new Date(b.date).getTime()
        );
      }

      if (sortBy === "highest") {
        return b.amount - a.amount;
      }

      return a.amount - b.amount;
    });
  }, [expenses, selectedCategory, sortBy]);

  function openDeleteModal(id: string, description: string) {
    setExpenseToDelete({
      id,
      description,
    });
  }

  function closeDeleteModal() {
    setExpenseToDelete(null);
  }

  function confirmDelete() {
    if (!expenseToDelete) {
      return;
    }

    deleteExpense(expenseToDelete.id);
    setExpenseToDelete(null);
  }

  if (expenses.length === 0) {
    return (
      <div className="surface">
        <EmptyState
          icon="$"
          title="No expenses yet"
          description="Your expenses will appear here after you record your first transaction."
          actionLabel="Add your first expense"
          actionHref="/expenses/new"
        />
      </div>
    );
  }

  return (
    <>
      <section className="surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-light)]">
              View options
            </p>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {filteredAndSortedExpenses.length}{" "}
              {filteredAndSortedExpenses.length === 1
                ? "expense"
                : "expenses"}{" "}
              shown
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category-filter"
                className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Category
              </label>

              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value as
                      | "All"
                      | ExpenseCategory,
                  )
                }
                className="h-10 w-full min-w-[170px] rounded-[var(--radius-sm)] border border-[var(--border-dark)] bg-white px-3 text-sm outline-none transition focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green-light)]"
              >
                <option value="All">All categories</option>

                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="sort-expenses"
                className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]"
              >
                Sort by
              </label>

              <select
                id="sort-expenses"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as SortOption)
                }
                className="h-10 w-full min-w-[170px] rounded-[var(--radius-sm)] border border-[var(--border-dark)] bg-white px-3 text-sm outline-none transition focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green-light)]"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="highest">
                  Highest amount
                </option>
                <option value="lowest">
                  Lowest amount
                </option>
              </select>
            </div>
          </div>
        </div>

        {filteredAndSortedExpenses.length === 0 ? (
         <EmptyState
  icon="○"
  title="No matching expenses"
  description={`There are no expenses in the ${selectedCategory} category yet.`}
  actionLabel="Show all expenses"
  onAction={() => setSelectedCategory("All")}
/>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredAndSortedExpenses.map((expense) => (
              <article
                key={expense.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-green)] text-base">
                    {CATEGORY_ICONS[expense.category] ?? "•"}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      {expense.description}
                    </h2>

                    <p className="mt-1 text-xs text-[var(--text-light)]">
                      {expense.category} ·{" "}
                      {formatDate(expense.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <p className="shrink-0 text-sm font-bold">
                    ${formatAmount(expense.amount)}
                  </p>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/expenses/${expense.id}/edit`}
                      className="secondary-button min-h-9 px-3 text-xs"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        openDeleteModal(
                          expense.id,
                          expense.description,
                        )
                      }
                      className="min-h-9 rounded-[var(--radius-sm)] border border-transparent px-3 text-xs font-semibold text-[var(--danger)] transition hover:border-[var(--danger-light)] hover:bg-[var(--danger-light)]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {expenseToDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-expense-title"
          onClick={closeDeleteModal}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--danger-light)] text-sm font-bold text-[var(--danger)]">
              !
            </div>

            <h2
              id="delete-expense-title"
              className="mt-5 text-lg font-bold tracking-[-0.02em]"
            >
              Delete this expense?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              You are about to delete{" "}
              <span className="font-semibold text-[var(--text)]">
                "{expenseToDelete.description}"
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="secondary-button"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex min-h-[42px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--danger)] px-[17px] text-sm font-semibold text-white transition hover:opacity-90"
              >
                Delete expense
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}