import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="page-container py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-[var(--green)]">
            About
          </p>

          <h1 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">
            About The Last Rupiah
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            The Last Rupiah is a simple personal finance tracker designed to
            make keeping track of money feel clear and manageable.
          </p>
        </div>

        <div className="grid gap-5">
          <section className="surface p-6 md:p-7">
            <h2 className="text-lg font-bold">Why it exists</h2>

            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              Managing personal finances does not have to be complicated.
              The Last Rupiah focuses on the essentials: recording income,
              tracking expenses, understanding spending patterns, and seeing
              how your finances change over time.
            </p>
          </section>

          <section className="surface p-6 md:p-7">
            <h2 className="text-lg font-bold">Simple by design</h2>

            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              The app is designed to be useful without requiring an account.
              Your financial records can stay on the device and browser you
              use, while the interface remains simple enough to understand at
              a glance.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="secondary-button">
            Back to dashboard
          </Link>

          <Link href="/contact" className="primary-button">
            Contact
          </Link>
        </div>
      </div>
    </main>
  );
}