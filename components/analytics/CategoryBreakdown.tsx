"use client";

import { useMemo } from "react";
import {
  CATEGORY_ICONS,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/lib/expenses";
import { useExpenses } from "@/components/expenses/ExpenseProvider";
import {
  getExpensesForMonth,
  getMonthLabel,
} from "@/lib/finance";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

type CategoryBreakdownProps = {
  monthKey: string;
};

export default function CategoryBreakdown({
  monthKey,
}: CategoryBreakdownProps) {
  const { expenses } = useExpenses();

  const categoryData = useMemo(() => {
    const monthlyExpenses = getExpensesForMonth(
      expenses,
      monthKey,
    );

    const totals = EXPENSE_CATEGORIES.map((category) => {
      const amount = monthlyExpenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        category,
        amount,
      };
    });

    const totalSpending = totals.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    return totals
      .map((item) => ({
        ...item,
        percentage:
          totalSpending > 0
            ? (item.amount / totalSpending) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, monthKey]);

  const topCategory = categoryData.find(
    (item) => item.amount > 0,
  );

  return (
    <article className="surface p-6">
      <div>
        <h2 className="text-lg font-bold tracking-[-0.02em]">
          Spending by category
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          See where your money went in{" "}
          {getMonthLabel(monthKey)}.
        </p>
      </div>

      {topCategory ? (
        <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--surface-green)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--green)]">
            Highest spending category
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {
                  CATEGORY_ICONS[
                    topCategory.category as ExpenseCategory
                  ]
                }
              </span>

              <span className="text-sm font-bold">
                {topCategory.category}
              </span>
            </div>

            <span className="text-sm font-bold text-[var(--green)]">
              ${formatAmount(topCategory.amount)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-7 space-y-5">
        {categoryData.map((item) => (
          <div key={item.category}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-sm">
                  {
                    CATEGORY_ICONS[
                      item.category as ExpenseCategory
                    ]
                  }
                </span>

                <span className="truncate text-sm font-semibold">
                  {item.category}
                </span>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-sm font-semibold">
                  ${formatAmount(item.amount)}
                </span>

                <span className="ml-2 text-xs text-[var(--text-light)]">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
              <div
                className="h-full rounded-full bg-[var(--green)] transition-all"
                style={{
                  width: `${item.percentage}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}