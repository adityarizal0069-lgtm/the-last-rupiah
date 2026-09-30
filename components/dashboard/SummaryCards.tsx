"use client";

import { useMemo } from "react";
import { useExpenses } from "@/components/expenses/ExpenseProvider";
import { useIncome } from "@/components/income/IncomeProvider";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

function getCurrentMonthKey() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

export default function SummaryCards() {
  const { expenses } = useExpenses();
  const { income } = useIncome();

  const summary = useMemo(() => {
    const currentMonth = getCurrentMonthKey();

    const totalIncome = income.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const totalExpenses = expenses.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    const monthlyIncome = income
      .filter((item) => item.date.startsWith(currentMonth))
      .reduce((sum, item) => sum + item.amount, 0);

    const monthlyExpenses = expenses
      .filter((item) => item.date.startsWith(currentMonth))
      .reduce((sum, item) => sum + item.amount, 0);

    const monthlyTransactions =
      income.filter((item) =>
        item.date.startsWith(currentMonth),
      ).length +
      expenses.filter((item) =>
        item.date.startsWith(currentMonth),
      ).length;

    return {
      balance: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      monthlyNet: monthlyIncome - monthlyExpenses,
      monthlyTransactions,
    };
  }, [expenses, income]);

  const monthName = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  const cards = [
    {
      label: "Current balance",
      value: `$${formatAmount(summary.balance)}`,
      description: "Income minus spending, all time",
      danger: summary.balance < 0,
    },
    {
      label: "Income this month",
      value: `$${formatAmount(summary.monthlyIncome)}`,
      description: monthName,
      danger: false,
    },
    {
      label: "Spending this month",
      value: `$${formatAmount(summary.monthlyExpenses)}`,
      description: monthName,
      danger: false,
    },
    {
      label: "Net this month",
      value: `$${formatAmount(summary.monthlyNet)}`,
      description: `${summary.monthlyTransactions} transactions`,
      danger: summary.monthlyNet < 0,
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