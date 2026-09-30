"use client";

import Link from "next/link";
import { useState } from "react";
import Header from "@/components/layout/Header";
import EmptyState from "@/components/ui/EmptyState";
import {
  INCOME_CATEGORY_ICONS,
  type IncomeCategory,
} from "@/lib/income";
import { useIncome } from "@/components/income/IncomeProvider";

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

export default function IncomePage() {
  const { income, deleteIncome } = useIncome();

  const [incomeToDelete, setIncomeToDelete] =
    useState<{
      id: string;
      description: string;
    } | null>(null);

  function confirmDelete() {
    if (!incomeToDelete) {
      return;
    }

    deleteIncome(incomeToDelete.id);
    setIncomeToDelete(null);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="page-container py-10 md:py-14">
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
              Money coming in
            </p>

            <h1 className="text-3xl font-bold tracking-[-0.035em]">
              Income
            </h1>

            <p className="mt-3 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
              Keep track of the money you receive.
            </p>
          </div>

          <Link
            href="/income/new"
            className="primary-button shrink-0"
          >
            + Add income
          </Link>
        </section>

        {income.length === 0 ? (
          <section className="surface">
            <EmptyState
              icon="+"
              title="No income yet"
              description="Your income records will appear here after you add your first source of income."
              actionLabel="Add your first income"
              actionHref="/income/new"
            />
          </section>
        ) : (
          <section className="surface overflow-hidden">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <p className="text-sm text-[var(--text-secondary)]">
                {income.length}{" "}
                {income.length === 1
                  ? "income record"
                  : "income records"}
              </p>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {income.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-green)] text-base">
                      {
                        INCOME_CATEGORY_ICONS[
                          item.category as IncomeCategory
                        ]
                      }
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold">
                        {item.description}
                      </h2>

                      <p className="mt-1 text-xs text-[var(--text-light)]">
                        {item.category} ·{" "}
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <p className="shrink-0 text-sm font-bold text-[var(--green)]">
                      +${formatAmount(item.amount)}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setIncomeToDelete({
                          id: item.id,
                          description: item.description,
                        })
                      }
                      className="min-h-9 rounded-[var(--radius-sm)] border border-transparent px-3 text-xs font-semibold text-[var(--danger)] transition hover:border-[var(--danger-light)] hover:bg-[var(--danger-light)]"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {incomeToDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-income-title"
          onClick={() => setIncomeToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-md)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--danger-light)] text-sm font-bold text-[var(--danger)]">
              !
            </div>

            <h2
              id="delete-income-title"
              className="mt-5 text-lg font-bold tracking-[-0.02em]"
            >
              Delete this income?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              You are about to delete{" "}
              <span className="font-semibold text-[var(--text)]">
                "{incomeToDelete.description}"
              </span>
              . This action cannot be undone.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIncomeToDelete(null)}
                className="secondary-button"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex min-h-[42px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--danger)] px-[17px] text-sm font-semibold text-white transition hover:opacity-90"
              >
                Delete income
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}