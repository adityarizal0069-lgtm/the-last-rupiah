import Link from "next/link";
import Header from "@/components/layout/Header";
import ExpenseList from "@/components/expenses/ExpenseList";

export default function ExpensesPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="page-container py-10 md:py-14">
        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
              Your transactions
            </p>

            <h1 className="text-3xl font-bold tracking-[-0.035em]">
              Expenses
            </h1>

            <p className="mt-3 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
              Keep track of where your money goes.
            </p>
          </div>

          <Link
            href="/expenses/new"
            className="primary-button shrink-0"
          >
            + Add expense
          </Link>
        </section>

        <ExpenseList />
      </main>
    </div>
  );
}