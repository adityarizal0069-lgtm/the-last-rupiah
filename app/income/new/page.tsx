import Link from "next/link";
import Header from "@/components/layout/Header";
import IncomeForm from "@/components/income/IncomeForm";

export default function NewIncomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="page-container py-10 md:py-14">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/income"
            className="text-sm font-semibold text-[var(--green)] hover:underline"
          >
            ← Back to income
          </Link>

          <div className="mt-8 mb-7">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
              New income
            </p>

            <h1 className="text-3xl font-bold tracking-[-0.035em]">
              Add income
            </h1>

            <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
              Record money that came in so you can understand your
              overall financial picture.
            </p>
          </div>

          <IncomeForm />
        </div>
      </main>
    </div>
  );
}