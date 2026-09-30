import Link from "next/link";
import Header from "@/components/layout/Header";
import SummaryCards from "@/components/dashboard/SummaryCards";
import SpendingOverview from "@/components/dashboard/SpendingOverview";
import RecentExpenses from "@/components/dashboard/RecentExpenses";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="page-container py-10 md:py-14">
        <section className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--green)]">
              Your money, clearly
            </p>

            <h1 className="text-3xl font-bold tracking-[-0.035em] md:text-4xl">
              Good evening.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
              See your current balance and understand how your money
              is moving this month.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href="/income/new"
              className="secondary-button shrink-0"
            >
              + Add income
            </Link>

            <Link
              href="/expenses/new"
              className="primary-button shrink-0"
            >
              + Add expense
            </Link>
          </div>
        </section>

        <SummaryCards />

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
          <SpendingOverview />
          <RecentExpenses />
        </section>
      </main>
    </div>
  );
}