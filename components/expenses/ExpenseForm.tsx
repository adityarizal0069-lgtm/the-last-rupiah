"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/lib/expenses";
import { useExpenses } from "@/components/expenses/ExpenseProvider";
import { getLocalDateString } from "@/lib/date";

const MAX_DESCRIPTION_LENGTH = 100;
const MAX_AMOUNT = 999_999_999_999;

export default function ExpenseForm() {
  const router = useRouter();
  const { addExpense } = useExpenses();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] =
    useState<ExpenseCategory>("Food");
  const [date, setDate] = useState(
    getLocalDateString(),
  );
  const [error, setError] = useState("");

  function validateForm() {
    const trimmedDescription = description.trim();
    const numericAmount = Number(amount);

    if (!trimmedDescription) {
      return "Please enter a description.";
    }

    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
    }

    if (!amount.trim()) {
      return "Please enter an amount.";
    }

    if (!Number.isFinite(numericAmount)) {
      return "Please enter a valid amount.";
    }

    if (numericAmount <= 0) {
      return "Amount must be greater than zero.";
    }

    if (!Number.isInteger(numericAmount)) {
      return "Amount must be a whole number.";
    }

    if (numericAmount > MAX_AMOUNT) {
      return "Amount is too large.";
    }

    if (!date) {
      return "Please select a date.";
    }

    return "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");

    addExpense({
      description: description.trim(),
      amount: Number(amount),
      category,
      date,
    });

    router.push("/expenses");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="surface p-6 md:p-8"
    >
      <div className="grid gap-6">
        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold"
          >
            Description
          </label>

          <input
            id="description"
            type="text"
            value={description}
            maxLength={MAX_DESCRIPTION_LENGTH}
            onChange={(event) => {
              setDescription(event.target.value);
              setError("");
            }}
            placeholder="e.g. Lunch with friends"
            className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-dark)] bg-white px-3.5 text-sm outline-none transition focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green-light)]"
          />

          <div className="mt-2 flex justify-end">
            <span className="text-xs text-[var(--text-light)]">
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="amount"
              className="mb-2 block text-sm font-semibold"
            >
              Amount
            </label>

            <div className="flex h-11 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-dark)] bg-white transition focus-within:border-[var(--green)] focus-within:ring-2 focus-within:ring-[var(--green-light)]">
              <span className="flex items-center border-r border-[var(--border)] bg-[var(--surface-soft)] px-3.5 text-sm font-semibold text-[var(--text-secondary)]">
                $
              </span>

              <input
                id="amount"
                type="number"
                min="1"
                max={MAX_AMOUNT}
                step="1"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError("");
                }}
                placeholder="45000"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              />
            </div>

            <p className="mt-2 text-xs text-[var(--text-light)]">
              Enter the amount as a whole number.
            </p>
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-semibold"
            >
              Category
            </label>

            <select
              id="category"
              value={category}
              onChange={(event) => {
                setCategory(
                  event.target.value as ExpenseCategory,
                );
                setError("");
              }}
              className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-dark)] bg-white px-3.5 text-sm outline-none transition focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green-light)]"
            >
              {EXPENSE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="date"
            className="mb-2 block text-sm font-semibold"
          >
            Date
          </label>

          <input
            id="date"
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setError("");
            }}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-dark)] bg-white px-3.5 text-sm outline-none transition focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green-light)]"
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-[var(--radius-sm)] bg-[var(--danger-light)] px-3.5 py-3 text-sm font-medium text-[var(--danger)]"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="secondary-button"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="primary-button"
        >
          Save expense
        </button>
      </div>
    </form>
  );
}