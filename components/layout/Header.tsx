
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const DEVELOPER_EMAIL = "adityarizal0069@gmail.com";

const navigationItems = [
  { href: "/", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/income", label: "Income" },
  { href: "/analytics", label: "Analytics" },
];

function RpLogo() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-10 w-10 shrink-0 flex-col items-center justify-center overflow-hidden rounded-[10px] bg-[var(--green)]"
    >
      <span className="flex items-center justify-center gap-1 text-[17px] font-black leading-none text-white">
        <span className="relative inline-block">
          R
          <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[var(--green)]" />
        </span>

        <span className="relative inline-block">
          P
          <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[var(--green)]" />
        </span>
      </span>

      <span className="mt-1 whitespace-nowrap text-[4px] font-bold tracking-[0.04em] text-white">
        THE LAST RUPIAH
      </span>
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUser(currentUser);
      setAuthLoading(false);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isDeveloper =
    user?.email?.toLowerCase() === DEVELOPER_EMAIL.toLowerCase();

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();

    await supabase.auth.signOut();

    setUser(null);
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="page-container flex min-h-[72px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link
            href="/"
            aria-label="The Last Rupiah home"
            className="flex min-w-0 shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <RpLogo />
            <span className="truncate text-[17px] font-bold tracking-[-0.02em]">
              The Last Rupiah
            </span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-[var(--green)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!authLoading && isDeveloper && (
            <Link
              href="/developer"
              className="secondary-button min-h-[38px] px-3 text-xs"
            >
              Developer
            </Link>
          )}

          {!authLoading && user ? (
            <>
              <span className="hidden max-w-[240px] truncate text-xs font-medium text-[var(--text-secondary)] lg:block">
                {user.email}
              </span>

              <button
                type="button"
                onClick={handleSignOut}
                className="secondary-button min-h-[38px] px-3 text-xs"
              >
                Sign out
              </button>
            </>
          ) : !authLoading ? (
            <Link
              href="/sign-in"
              className="primary-button min-h-[38px] px-3 text-xs"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[var(--border)] md:hidden">
        <nav className="page-container flex gap-5 overflow-x-auto py-3">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "text-[var(--green)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
