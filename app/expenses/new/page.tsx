import Link from "next/link";
import Header from "@/components/layout/Header";
import ExpenseForm from "@/components/expenses/ExpenseForm";

export default function NewExpensePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="page-container py-10 md:py-14">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--green)] hover:underline"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-8 mb-7">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
              New transaction
            </p>

            <h1 className="text-3xl font-bold tracking-[-0.035em]">
              Add an expense
            </h1>

            <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
              Record where your money went so you can keep a clearer picture
              of your spending.
            </p>
          </div>

          <ExpenseForm />
        </div>
      </main>
    </div>
  );
}