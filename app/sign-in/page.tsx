"use client";

import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function SignInPage() {
  const handleGoogleSignIn = async () => {
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google sign-in error:", error);
    }
  };

  return (
    <main className="page-container flex min-h-[calc(100vh-72px)] items-center justify-center py-10 md:py-14">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold text-[var(--green)]">
            The Last Rupiah
          </p>

          <h1 className="text-3xl font-bold tracking-[-0.03em]">
            Sign in
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
            Sign in with Google to access your account and use your financial
            data across devices.
          </p>
        </div>

        <section className="surface p-6 md:p-7">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex min-h-[46px] w-full items-center justify-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-dark)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-soft)]"
          >
            <span
              aria-hidden="true"
              className="flex h-5 w-5 items-center justify-center text-base font-bold"
            >
              G
            </span>

            Continue with Google
          </button>

          <p className="mt-5 text-center text-xs leading-5 text-[var(--text-light)]">
            You can continue using The Last Rupiah without signing in. Your
            local data will remain on this device.
          </p>
        </section>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--green)] transition-colors hover:text-[var(--green-hover)]"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}