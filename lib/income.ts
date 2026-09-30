export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Other",
] as const;

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export type Income = {
  id: string;
  description: string;
  amount: number;
  category: IncomeCategory;
  date: string;
  createdAt: string;
};

export const INCOME_STORAGE_KEY = "the-last-rupiah-income";

export const INCOME_CATEGORY_ICONS: Record<IncomeCategory, string> = {
  Salary: "💼",
  Freelance: "💻",
  Business: "🏢",
  Other: "＋",
};