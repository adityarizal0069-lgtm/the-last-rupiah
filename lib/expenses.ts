export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Education",
  "Entertainment",
  "Health",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  createdAt: string;
};

export const EXPENSE_STORAGE_KEY = "the-last-rupiah-expenses";

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  Food: "🍜",
  Transport: "🚗",
  Shopping: "🛍️",
  Bills: "📄",
  Education: "📚",
  Entertainment: "🎬",
  Health: "💚",
  Other: "•",
};