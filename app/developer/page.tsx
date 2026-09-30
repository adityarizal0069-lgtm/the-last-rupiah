import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const DEVELOPER_EMAIL = "adityarizal0069@gmail.com";

type SupabaseUser = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string | null;
};

export default async function DeveloperPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== DEVELOPER_EMAIL) {
    redirect("/");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=100`,
    {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to load users. Supabase returned ${response.status}.`,
    );
  }

  const result = (await response.json()) as {
    users?: SupabaseUser[];
    total?: number;
  };

  const users = result.users ?? [];
  const totalUsers = result.total ?? users.length;

  return (
    <main className="page-container py-10 md:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-[var(--green)]">
            Developer
          </p>

          <h1 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">
            User overview
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
            A basic overview of registered The Last Rupiah users.
          </p>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="surface p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-light)]">
              Registered users
            </p>

            <p className="mt-2 text-3xl font-bold tracking-[-0.03em]">
              {totalUsers}
            </p>
          </div>

          <div className="surface p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-light)]">
              Developer account
            </p>

            <p className="mt-2 truncate text-sm font-semibold">
              {DEVELOPER_EMAIL}
            </p>
          </div>
        </section>

        <section className="surface overflow-hidden">
          <div className="border-b border-[var(--border)] px-5 py-4 md:px-6">
            <h2 className="text-base font-bold">
              Registered users
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
              No registered users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-soft)]">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-light)]">
                      Email
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-light)]">
                      Created
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-light)]">
                      Last sign-in
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-light)]">
                      User ID
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((registeredUser) => (
                    <tr
                      key={registeredUser.id}
                      className="border-b border-[var(--border)] last:border-b-0"
                    >
                      <td className="px-5 py-4 text-sm font-medium">
                        {registeredUser.email ?? "No email"}
                      </td>

                      <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                        {formatDate(registeredUser.created_at)}
                      </td>

                      <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                        {registeredUser.last_sign_in_at
                          ? formatDate(
                              registeredUser.last_sign_in_at,
                            )
                          : "Never"}
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-[var(--text-light)]">
                        {registeredUser.id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}