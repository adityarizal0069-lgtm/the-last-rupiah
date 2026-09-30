"use client";

import { useMemo } from "react";
import { useExpenses } from "@/components/expenses/ExpenseProvider";
import { useIncome } from "@/components/income/IncomeProvider";
import {
  calculateMonthlyTotals,
  getAvailableMonthKeys,
  getMonthLabel,
} from "@/lib/finance";

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US").format(amount);
}

type MonthlyHistoryProps = {
  selectedMonth: string;
  onSelectMonth: (monthKey: string) => void;
};

export default function MonthlyHistory({
  selectedMonth,
  onSelectMonth,
}: MonthlyHistoryProps) {
  const { expenses } = useExpenses();
  const { income } = useIncome();

  const history = useMemo(() => {
    const monthKeys = getAvailableMonthKeys(
      income,
      expenses,
    );

    return monthKeys.map((monthKey) => ({
      monthKey,
      label: getMonthLabel(monthKey),
      totals: calculateMonthlyTotals(
        income,
        expenses,
        monthKey,
      ),
    }));
  }, [income, expenses]);

  return (
    <article className="surface mt-6 p-6">
      <div>
        <h2 className="text-lg font-bold tracking-[-0.02em]">
          Monthly history
        </h2>

        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Compare your income and spending across every month
          with recorded activity.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr] gap-4 border-b border-[var(--border)] px-4 pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-light)]">
            <span>Month</span>
            <span className="text-right">Income</span>
            <span className="text-right">Spending</span>
            <span className="text-right">Net</span>
            <span className="text-right">Activity</span>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {history.map((item) => {
              const isSelected =
                item.monthKey === selectedMonth;

              return (
                <button
                  key={item.monthKey}
                  type="button"
                  onClick={() =>
                    onSelectMonth(item.monthKey)
                  }
                  className={`grid w-full grid-cols-[1.5fr_1fr_1fr_1fr_0.8fr] gap-4 px-4 py-4 text-left transition-colors ${
                    isSelected
                      ? "bg-[var(--surface-green)]"
                      : "hover:bg-[var(--surface-soft)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        isSelected
                          ? "bg-[var(--green)]"
                          : "bg-[var(--border-dark)]"
                      }`}
                    />

                    <span className="text-sm font-semibold">
                      {item.label}
                    </span>
                  </div>

                  <span className="text-right text-sm font-semibold text-[var(--green)]">
                    ${formatAmount(item.totals.income)}
                  </span>

                  <span className="text-right text-sm font-semibold">
                    ${formatAmount(item.totals.expenses)}
                  </span>

                  <span
                    className={`text-right text-sm font-bold ${
                      item.totals.net < 0
                        ? "text-[var(--danger)]"
                        : "text-[var(--text)]"
                    }`}
                  >
                    {item.totals.net < 0 ? "-" : ""}$
                    {formatAmount(
                      Math.abs(item.totals.net),
                    )}
                  </span>

                  <span className="text-right text-sm text-[var(--text-secondary)]">
                    {item.totals.transactions}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--text-light)]">
        Select a month to update the analytics above.
      </p>
    </article>
  );
}