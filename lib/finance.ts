import type { Expense } from "@/lib/expenses";
import type { Income } from "@/lib/income";

export type MonthlyTotals = {
  income: number;
  expenses: number;
  net: number;
  transactions: number;
};

export function getCurrentMonthKey() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

export function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export function isDateInMonth(
  date: string,
  monthKey: string,
) {
  return date.startsWith(monthKey);
}

export function getIncomeForMonth(
  income: Income[],
  monthKey: string,
) {
  return income.filter((item) =>
    isDateInMonth(item.date, monthKey),
  );
}

export function getExpensesForMonth(
  expenses: Expense[],
  monthKey: string,
) {
  return expenses.filter((item) =>
    isDateInMonth(item.date, monthKey),
  );
}

export function calculateMonthlyTotals(
  income: Income[],
  expenses: Expense[],
  monthKey: string,
): MonthlyTotals {
  const monthlyIncome = getIncomeForMonth(
    income,
    monthKey,
  );

  const monthlyExpenses = getExpensesForMonth(
    expenses,
    monthKey,
  );

  const incomeTotal = monthlyIncome.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const expenseTotal = monthlyExpenses.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return {
    income: incomeTotal,
    expenses: expenseTotal,
    net: incomeTotal - expenseTotal,
    transactions:
      monthlyIncome.length + monthlyExpenses.length,
  };
}

export function getAvailableMonthKeys(
  income: Income[],
  expenses: Expense[],
) {
  const monthKeys = new Set<string>();

  monthKeys.add(getCurrentMonthKey());

  income.forEach((item) => {
    monthKeys.add(item.date.slice(0, 7));
  });

  expenses.forEach((item) => {
    monthKeys.add(item.date.slice(0, 7));
  });

  return Array.from(monthKeys).sort((a, b) =>
    b.localeCompare(a),
  );
}