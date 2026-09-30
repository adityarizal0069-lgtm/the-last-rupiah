"use client";

import { useMemo } from "react";
import {
  INCOME_CATEGORIES,
  INCOME_CATEGORY_ICONS,
  type IncomeCategory,
} from "@/lib/income";
import { useIncome } from "@/components/income/IncomeProvider";
import {
  getIncomeForMonth,
  getMonthLabel,
} from "@/lib/finance";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

type IncomeBreakdownProps = {
  monthKey: string;
};

export default function IncomeBreakdown({
  monthKey,
}: IncomeBreakdownProps) {
  const { income } = useIncome();

  const incomeData = useMemo(() => {
    const monthlyIncome = getIncomeForMonth(
      income,
      monthKey,
    );

    const totals = INCOME_CATEGORIES.map((category) => {
      const amount = monthlyIncome
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        category,
        amount,
      };
    });

    const totalIncome = totals.reduce(
      (sum, item) => sum + item.amount,
      0,
    );

    return totals
      .map((item) => ({
        ...item,
        percentage:
          totalIncome > 0
            ? (item.amount / totalIncome) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [income, monthKey]);

  const topSource = incomeData.find(
    (item) => item.amount > 0,
  );

  return (
    <article className="surface p-6">
      <div>
        <h2 className="text-lg font-bold tracking-[-0.02em]">
          Income by source
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          See where your money came from in{" "}
          {getMonthLabel(monthKey)}.
        </p>
      </div>

      {topSource ? (
        <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--surface-green)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--green)]">
            Largest income source
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {
                  INCOME_CATEGORY_ICONS[
                    topSource.category as IncomeCategory
                  ]
                }
              </span>

              <span className="text-sm font-bold">
                {topSource.category}
              </span>
            </div>

            <span className="text-sm font-bold text-[var(--green)]">
              ${formatAmount(topSource.amount)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-7 space-y-5">
        {incomeData.map((item) => (
          <div key={item.category}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-sm">
                  {
                    INCOME_CATEGORY_ICONS[
                      item.category as IncomeCategory
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