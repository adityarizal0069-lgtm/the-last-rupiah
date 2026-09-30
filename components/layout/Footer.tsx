import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="page-container flex min-h-[72px] flex-col items-center justify-between gap-3 py-5 sm:flex-row">
        <p className="text-xs text-[var(--text-light)]">
          © {new Date().getFullYear()} The Last Rupiah
        </p>

        <nav className="flex items-center gap-5">
          <Link
            href="/about"
            className="text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--green)]"
          >
            About
          </Link>

          <Link
            href="/contact"
            className="text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--green)]"
          >
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}