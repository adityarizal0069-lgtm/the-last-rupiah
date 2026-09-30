"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import MonthlySelector from "@/components/analytics/MonthlySelector";
import MonthlySummary from "@/components/analytics/MonthlySummary";
import CategoryBreakdown from "@/components/analytics/CategoryBreakdown";
import IncomeBreakdown from "@/components/analytics/IncomeBreakdown";
import MonthlyHistory from "@/components/analytics/MonthlyHistory";
import EmptyState from "@/components/ui/EmptyState";
import { useExpenses } from "@/components/expenses/ExpenseProvider";
import { useIncome } from "@/components/income/IncomeProvider";
import {
  getAvailableMonthKeys,
  getExpensesForMonth,
  getIncomeForMonth,
  getMonthLabel,
} from "@/lib/finance";

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

export default function AnalyticsPage() {
  const { expenses } = useExpenses();
  const { income } = useIncome();

  const monthKeys = useMemo(
    () => getAvailableMonthKeys(income, expenses),
    [income, expenses],
  );

  const [selectedMonth, setSelectedMonth] = useState("");

  const currentMonth =
    monthKeys.includes(selectedMonth)
      ? selectedMonth
      : monthKeys[0] ?? "";

  const monthlyExpenses = useMemo(
    () =>
      currentMonth
        ? getExpensesForMonth(expenses, currentMonth)
        : [],
    [expenses, currentMonth],
  );

  const monthlyIncome = useMemo(
    () =>
      currentMonth
        ? getIncomeForMonth(income, currentMonth)
        : [],
    [income, currentMonth],
  );

  const monthlyActivity = useMemo(() => {
    return [
      ...monthlyExpenses.map((item) => ({
        id: `expense-${item.id}`,
        description: item.description,
        category: item.category,
        date: item.date,
        amount: item.amount,
        type: "expense" as const,
      })),
      ...monthlyIncome.map((item) => ({
        id: `income-${item.id}`,
        description: item.description,
        category: item.category,
        date: item.date,
        amount: item.amount,
        type: "income" as const,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      )
      .slice(0, 8);
  }, [monthlyExpenses, monthlyIncome]);

  const hasData =
    monthlyExpenses.length > 0 ||
    monthlyIncome.length > 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="page-container py-10 md:py-14">
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
              Understand your money
            </p>

            <h1 className="text-3xl font-bold tracking-[-0.035em] md:text-4xl">
              Analytics
            </h1>

            <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
              Explore your income and spending across
              different months.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/income/new"
              className="secondary-button shrink-0"
            >
              + Income
            </Link>

            <Link
              href="/expenses/new"
              className="primary-button shrink-0"
            >
              + Expense
            </Link>
          </div>
        </section>

        {monthKeys.length === 0 ? (
          <section className="surface">
            <EmptyState
              icon="◌"
              title="Not enough data yet"
              description="Add income or expenses and your monthly analytics will appear here."
              actionLabel="Add your first expense"
              actionHref="/expenses/new"
            />
          </section>
        ) : (
          <>
            <MonthlySelector
              monthKeys={monthKeys}
              selectedMonth={currentMonth}
              onChange={setSelectedMonth}
            />

            <section className="mt-6">
              <MonthlySummary
                monthKey={currentMonth}
              />
            </section>

            {!hasData ? (
              <section className="surface mt-6">
                <EmptyState
                  icon="○"
                  title="No activity this month"
                  description={`There is no income or spending recorded for ${getMonthLabel(
                    currentMonth,
                  )}. Choose another month or add a transaction.`}
                  actionLabel="Add an expense"
                  actionHref="/expenses/new"
                />
              </section>
            ) : (
              <>
                <section className="mt-6 grid gap-6 lg:grid-cols-2">
                  <CategoryBreakdown
                    monthKey={currentMonth}
                  />

                  <IncomeBreakdown
                    monthKey={currentMonth}
                  />
                </section>

                <article className="surface mt-6 p-6">
                  <div>
                    <h2 className="text-lg font-bold tracking-[-0.02em]">
                      Monthly activity
                    </h2>

                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Income and expenses recorded during{" "}
                      {getMonthLabel(currentMonth)}.
                    </p>
                  </div>

                  <div className="mt-6 divide-y divide-[var(--border)]">
                    {monthlyActivity.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                item.type === "income"
                                  ? "bg-[var(--green)]"
                                  : "bg-[var(--text-light)]"
                              }`}
                            />

                            <p className="truncate text-sm font-semibold">
                              {item.description}
                            </p>
                          </div>

                          <p className="mt-1 pl-4 text-xs text-[var(--text-light)]">
                            {item.category} ·{" "}
                            {formatDate(item.date)}
                          </p>
                        </div>

                        <p
                          className={`shrink-0 text-sm font-bold ${
                            item.type === "income"
                              ? "text-[var(--green)]"
                              : ""
                          }`}
                        >
                          {item.type === "income"
                            ? "+"
                            : "-"}
                          ${formatAmount(item.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              </>
            )}

            <MonthlyHistory
              selectedMonth={currentMonth}
              onSelectMonth={setSelectedMonth}
            />
          </>
        )}
      </main>
    </div>
  );
}