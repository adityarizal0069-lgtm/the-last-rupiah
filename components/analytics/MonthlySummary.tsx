"use client";

import { useMemo } from "react";
import { useExpenses } from "@/components/expenses/ExpenseProvider";
import { useIncome } from "@/components/income/IncomeProvider";
import { calculateMonthlyTotals, getMonthLabel } from "@/lib/finance";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

type MonthlySummaryProps = {
  monthKey: string;
};

export default function MonthlySummary({
  monthKey,
}: MonthlySummaryProps) {
  const { expenses } = useExpenses();
  const { income } = useIncome();

  const summary = useMemo(
    () =>
      calculateMonthlyTotals(
        income,
        expenses,
        monthKey,
      ),
    [income, expenses, monthKey],
  );

  const monthLabel = getMonthLabel(monthKey);

  const cards = [
    {
      label: "Income",
      value: `$${formatAmount(summary.income)}`,
      description: `Money received in ${monthLabel}`,
      danger: false,
    },
    {
      label: "Spending",
      value: `$${formatAmount(summary.expenses)}`,
      description: `Money spent in ${monthLabel}`,
      danger: false,
    },
    {
      label: "Net",
      value: `$${formatAmount(summary.net)}`,
      description: "Income minus spending",
      danger: summary.net < 0,
    },
    {
      label: "Transactions",
      value: String(summary.transactions),
      description: `Income and expenses in ${monthLabel}`,
      danger: false,
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

          <p
            className={`mt-4 text-2xl font-bold tracking-[-0.035em] ${
              card.danger
                ? "text-[var(--danger)]"
                : ""
            }`}
          >
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