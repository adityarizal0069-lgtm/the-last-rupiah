"use client";

import { useMemo } from "react";
import { useExpenses } from "@/components/expenses/ExpenseProvider";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

export default function SpendingOverview() {
  const { expenses } = useExpenses();

  const spendingData = useMemo(() => {
    const today = new Date();
    const data: {
      day: string;
      amount: number;
    }[] = [];

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today);

      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - index);

      const dateKey = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      const amount = expenses
        .filter((expense) => expense.date === dateKey)
        .reduce((sum, expense) => sum + expense.amount, 0);

      data.push({
        day: date.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        amount,
      });
    }

    return data;
  }, [expenses]);

  const maxAmount = Math.max(
    ...spendingData.map((item) => item.amount),
    1,
  );

  const weeklyTotal = spendingData.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const dailyAverage = weeklyTotal / 7;

  return (
    <article className="surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-[-0.02em]">
            Spending overview
          </h2>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your actual spending over the last 7 days.
          </p>
        </div>

        <span className="rounded-full bg-[var(--green-light)] px-3 py-1 text-xs font-semibold text-[var(--green)]">
          7 days
        </span>
      </div>

      {weeklyTotal === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-center">
          <div>
            <p className="text-sm font-semibold">
              No spending recorded
            </p>

            <p className="mt-1 text-xs text-[var(--text-light)]">
              Add an expense to see your spending activity.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex h-[220px] items-end gap-3 sm:gap-5">
          {spendingData.map((item, index) => {
            const height =
              item.amount > 0
                ? Math.max(
                    (item.amount / maxAmount) * 100,
                    8,
                  )
                : 0;

            return (
              <div
                key={`${item.day}-${index}`}
                className="flex h-full flex-1 flex-col items-center justify-end gap-3"
              >
                <div className="flex h-full w-full items-end">
                  <div
                    className="w-full rounded-t-lg bg-[var(--green)] transition-all hover:bg-[var(--green-hover)]"
                    style={{
                      height: `${height}%`,
                    }}
                    title={`$${formatAmount(item.amount)}`}
                  />
                </div>

                <span className="text-xs font-medium text-[var(--text-light)]">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-[var(--border)] pt-4">
        <div>
          <p className="text-xs text-[var(--text-light)]">
            Weekly spending
          </p>

          <p className="mt-1 text-base font-bold">
            ${formatAmount(weeklyTotal)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-[var(--text-light)]">
            Daily average
          </p>

          <p className="mt-1 text-base font-bold">
            ${formatAmount(Math.round(dailyAverage))}
          </p>
        </div>
      </div>
    </article>
  );
}