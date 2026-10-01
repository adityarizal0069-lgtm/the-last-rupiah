"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import Header from "@/components/layout/Header";
import MonthlySelector from "@/components/analytics/MonthlySelector";
import MonthlySummary from "@/components/analytics/MonthlySummary";
import CategoryBreakdown from "@/components/analytics/CategoryBreakdown";
import IncomeBreakdown from "@/components/analytics/IncomeBreakdown";
import MonthlyHistory from "@/components/analytics/MonthlyHistory";
import EmptyState from "@/components/ui/EmptyState";
import { useExpenses } from "@/components/expenses/ExpenseProvider";
import { useIncome } from "@/components/income/IncomeProvider";
import { EXPENSE_CATEGORIES } from "@/lib/expenses";
import { INCOME_CATEGORIES } from "@/lib/income";
import {
  calculateMonthlyTotals,
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

function formatPdfAmount(amount: number) {
  return `$${new Intl.NumberFormat("en-US").format(amount)}`;
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
    ].sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime(),
    );
  }, [monthlyExpenses, monthlyIncome]);

  const expenseCategoryData = useMemo(() => {
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
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyExpenses]);

  const incomeCategoryData = useMemo(() => {
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
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyIncome]);

  const hasData =
    monthlyExpenses.length > 0 ||
    monthlyIncome.length > 0;

  function downloadMonthlyPdf() {
    if (!currentMonth || !hasData) {
      return;
    }

    const doc = new jsPDF();
    const monthLabel = getMonthLabel(currentMonth);

    const summary = calculateMonthlyTotals(
      income,
      expenses,
      currentMonth,
    );

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 20;
    let y = 22;

    function addPageIfNeeded(requiredHeight: number) {
      if (y + requiredHeight > pageHeight - 20) {
        doc.addPage();
        y = 22;
      }
    }

    function addSectionTitle(title: string) {
      addPageIfNeeded(16);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(25, 25, 25);
      doc.text(title, margin, y);

      y += 9;
    }

    function addDivider() {
      doc.setDrawColor(220, 220, 220);
      doc.line(
        margin,
        y,
        pageWidth - margin,
        y,
      );
      y += 7;
    }

    function addTransactionRow(
      date: string,
      description: string,
      category: string,
      amount: number,
      type: "income" | "expense",
    ) {
      addPageIfNeeded(18);

      const amountText = `${
        type === "income" ? "+" : "-"
      }${formatPdfAmount(amount)}`;

      const descriptionText =
        description.length > 28
          ? `${description.slice(0, 25)}...`
          : description;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);

      doc.text(formatDate(date), margin, y);
      doc.text(
        descriptionText,
        margin + 30,
        y,
      );
      doc.text(
        category,
        margin + 82,
        y,
      );
      doc.text(
        amountText,
        pageWidth - margin,
        y,
        { align: "right" },
      );

      y += 7;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(25, 25, 25);
    doc.text(
      "THE LAST RUPIAH",
      margin,
      y,
    );

    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(15);
    doc.setTextColor(80, 80, 80);
    doc.text(
      "Monthly Financial Report",
      margin,
      y,
    );

    y += 8;

    doc.setFontSize(11);
    doc.text(monthLabel, margin, y);

    y += 7;

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generated ${new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date())}`,
      margin,
      y,
    );

    y += 12;

    addDivider();

    addSectionTitle("MONTHLY SUMMARY");

    const summaryRows = [
      ["Income", formatPdfAmount(summary.income)],
      ["Spending", formatPdfAmount(summary.expenses)],
      ["Net", formatPdfAmount(summary.net)],
      ["Transactions", String(summary.transactions)],
    ];

    doc.setFontSize(10);

    summaryRows.forEach(([label, value]) => {
      addPageIfNeeded(9);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(70, 70, 70);
      doc.text(label, margin, y);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(25, 25, 25);
      doc.text(
        value,
        pageWidth - margin,
        y,
        { align: "right" },
      );

      y += 7;
    });

    y += 5;

    addSectionTitle("SPENDING BY CATEGORY");

    if (expenseCategoryData.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "No spending recorded.",
        margin,
        y,
      );
      y += 8;
    } else {
      expenseCategoryData.forEach((item) => {
        addPageIfNeeded(12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);

        doc.text(
          item.category,
          margin,
          y,
        );

        doc.text(
          `${formatPdfAmount(
            item.amount,
          )} (${item.percentage.toFixed(0)}%)`,
          pageWidth - margin,
          y,
          { align: "right" },
        );

        y += 7;
      });

      const topCategory =
        expenseCategoryData[0];

      y += 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(
        `Highest spending category: ${topCategory.category}`,
        margin,
        y,
      );

      y += 9;
    }

    addSectionTitle("INCOME BY SOURCE");

    if (incomeCategoryData.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "No income recorded.",
        margin,
        y,
      );
      y += 8;
    } else {
      incomeCategoryData.forEach((item) => {
        addPageIfNeeded(12);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);

        doc.text(
          item.category,
          margin,
          y,
        );

        doc.text(
          `${formatPdfAmount(
            item.amount,
          )} (${item.percentage.toFixed(0)}%)`,
          pageWidth - margin,
          y,
          { align: "right" },
        );

        y += 7;
      });

      const topSource =
        incomeCategoryData[0];

      y += 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(
        `Largest income source: ${topSource.category}`,
        margin,
        y,
      );

      y += 9;
    }

    addSectionTitle("MONTHLY TRANSACTIONS");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);

    doc.text("DATE", margin, y);
    doc.text(
      "DESCRIPTION",
      margin + 30,
      y,
    );
    doc.text(
      "CATEGORY",
      margin + 82,
      y,
    );
    doc.text(
      "AMOUNT",
      pageWidth - margin,
      y,
      { align: "right" },
    );

    y += 7;

    addDivider();

    monthlyActivity.forEach((item) => {
      addTransactionRow(
        item.date,
        item.description,
        item.category,
        item.amount,
        item.type,
      );
    });

    const fileMonth =
      currentMonth.replace("-", "_");

    doc.save(
      `the-last-rupiah-${fileMonth}.pdf`,
    );
  }

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

          <div className="flex flex-wrap gap-2">
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
                <section className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={downloadMonthlyPdf}
                    className="secondary-button"
                  >
                    Download PDF Report
                  </button>
                </section>

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
                    {monthlyActivity
                      .slice(0, 8)
                      .map((item) => (
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