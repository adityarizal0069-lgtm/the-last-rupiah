"use client";

import { useMemo } from "react";
import { useExpenses } from "@/components/expenses/ExpenseProvider";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

export default function AnalyticsSummary() {
  const { expenses } = useExpenses();

  const summary = useMemo(() => {
    const total = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    const average =
      expenses.length > 0 ? total / expenses.length : 0;

    const highest =
      expenses.length > 0
        ? Math.max(...expenses.map((expense) => expense.amount))
        : 0;

    return {
      total,
      average,
      highest,
      transactions: expenses.length,
    };
  }, [expenses]);

  const cards = [
    {
      label: "Total spending",
      value: `$${formatAmount(summary.total)}`,
      description: "Across all recorded expenses",
    },
    {
      label: "Average expense",
      value: `$${formatAmount(Math.round(summary.average))}`,
      description: "Average amount per transaction",
    },
    {
      label: "Transactions",
      value: String(summary.transactions),
      description: "Expenses recorded",
    },
    {
      label: "Largest expense",
      value: `$${formatAmount(summary.highest)}`,
      description: "Highest single transaction",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="surface p-5"
        >
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {card.label}
          </p>

          <p className="mt-4 text-2xl font-bold tracking-[-0.035em]">
            {card.value}
          </p>

          <p className="mt-2 text-xs text-[var(--text-light)]">
            {card.description}
          </p>
        </article>
      ))}
    </section>
  );
}