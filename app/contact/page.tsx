import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="page-container py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-[var(--green)]">
            Contact
          </p>

          <h1 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">
            Get in touch
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            Have a question, suggestion, or simply want to get in touch?
            Feel free to reach out.
          </p>
        </div>

        <section className="surface p-6 md:p-8">
          <div className="border-b border-[var(--border)] pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-light)]">
              Created by
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em]">
              Mohammad Aditya Fahrizal
            </h2>
          </div>

          <div className="pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-light)]">
              Email
            </p>

            <a
              href="mailto:adityarizal0013@gmail.com"
              className="mt-2 inline-block text-base font-semibold text-[var(--green)] transition-colors hover:text-[var(--green-hover)]"
            >
              adityarizal0013@gmail.com
            </a>

            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Click the email address to open your default email application.
            </p>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="secondary-button">
            Back to dashboard
          </Link>

          <Link href="/about" className="primary-button">
            About The Last Rupiah
          </Link>
        </div>
      </div>
    </main>
  );
}