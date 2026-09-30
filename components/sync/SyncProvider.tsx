"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  Expense,
  EXPENSE_STORAGE_KEY,
} from "@/lib/expenses";
import {
  Income,
  INCOME_STORAGE_KEY,
} from "@/lib/income";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type SyncContextValue = {
  user: User | null;
  syncRequired: boolean;
  isSyncing: boolean;
  chooseDeviceData: () => void;
  chooseAccountData: () => void;
  confirmKeepDeviceData: () => void;
  cancelKeepDeviceData: () => void;
  deviceDataWarning: boolean;
};

const SyncContext = createContext<SyncContextValue | undefined>(
  undefined,
);

const supabase = createSupabaseBrowserClient();

function loadLocalData<T>(storageKey: string): T[] {
  try {
    const savedData = window.localStorage.getItem(storageKey);

    if (!savedData) {
      return [];
    }

    const parsedData: unknown = JSON.parse(savedData);

    return Array.isArray(parsedData)
      ? (parsedData as T[])
      : [];
  } catch {
    console.error(
      `Unable to load local data for ${storageKey}.`,
    );
    return [];
  }
}

function clearLocalData(storageKey: string) {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    console.error(
      `Unable to clear local data for ${storageKey}.`,
    );
  }
}

async function getAccountCounts(user: User) {
  const [
    { count: expenseCount, error: expenseError },
    { count: incomeCount, error: incomeError },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id),

    supabase
      .from("income")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id),
  ]);

  if (expenseError) {
    console.error(
      "Unable to check account expenses.",
      expenseError,
    );
    return null;
  }

  if (incomeError) {
    console.error(
      "Unable to check account income.",
      incomeError,
    );
    return null;
  }

  return {
    expenses: expenseCount ?? 0,
    income: incomeCount ?? 0,
  };
}

async function getExistingAccountIds(user: User) {
  const [
    { data: expenseRows, error: expenseError },
    { data: incomeRows, error: incomeError },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("id")
      .eq("user_id", user.id),

    supabase
      .from("income")
      .select("id")
      .eq("user_id", user.id),
  ]);

  if (expenseError) {
    console.error(
      "Unable to read existing account expenses.",
      expenseError,
    );
    return null;
  }

  if (incomeError) {
    console.error(
      "Unable to read existing account income.",
      incomeError,
    );
    return null;
  }

  return {
    expenses: expenseRows.map((row) => row.id),
    income: incomeRows.map((row) => row.id),
  };
}

async function uploadDeviceData(
  user: User,
  expenses: Expense[],
  income: Income[],
) {
  const expenseRecords = expenses.map((expense) => ({
    id: crypto.randomUUID(),
    user_id: user.id,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    created_at: expense.createdAt,
  }));

  const incomeRecords = income.map((item) => ({
    id: crypto.randomUUID(),
    user_id: user.id,
    description: item.description,
    amount: item.amount,
    category: item.category,
    date: item.date,
    created_at: item.createdAt,
  }));

  if (expenseRecords.length > 0) {
    const { error } = await supabase
      .from("expenses")
      .insert(expenseRecords);

    if (error) {
      console.error(
        "Unable to upload device expenses.",
        error,
      );
      return null;
    }
  }

  if (incomeRecords.length > 0) {
    const { error } = await supabase
      .from("income")
      .insert(incomeRecords);

    if (error) {
      console.error(
        "Unable to upload device income.",
        error,
      );

      if (expenseRecords.length > 0) {
        await supabase
          .from("expenses")
          .delete()
          .in(
            "id",
            expenseRecords.map((record) => record.id),
          )
          .eq("user_id", user.id);
      }

      return null;
    }
  }

  return {
    expenseIds: expenseRecords.map((record) => record.id),
    incomeIds: incomeRecords.map((record) => record.id),
  };
}

async function verifyUploadedData(
  user: User,
  expectedExpenseCount: number,
  expectedIncomeCount: number,
) {
  const counts = await getAccountCounts(user);

  if (!counts) {
    return false;
  }

  return (
    counts.expenses >= expectedExpenseCount &&
    counts.income >= expectedIncomeCount
  );
}

async function deleteOldAccountData(
  user: User,
  oldExpenseIds: string[],
  oldIncomeIds: string[],
) {
  if (oldExpenseIds.length > 0) {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .in("id", oldExpenseIds)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Unable to remove old account expenses.",
        error,
      );
      return false;
    }
  }

  if (oldIncomeIds.length > 0) {
    const { error } = await supabase
      .from("income")
      .delete()
      .in("id", oldIncomeIds)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Unable to remove old account income.",
        error,
      );
      return false;
    }
  }

  return true;
}

export function SyncProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [syncRequired, setSyncRequired] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceDataWarning, setDeviceDataWarning] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSync() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUser(currentUser);

      if (!currentUser) {
        setSyncRequired(false);
        return;
      }

      const localExpenses =
        loadLocalData<Expense>(EXPENSE_STORAGE_KEY);

      const localIncome =
        loadLocalData<Income>(INCOME_STORAGE_KEY);

      const hasDeviceData =
        localExpenses.length > 0 ||
        localIncome.length > 0;

      if (!hasDeviceData) {
        setSyncRequired(false);
        return;
      }

      const accountCounts =
        await getAccountCounts(currentUser);

      if (!mounted || accountCounts === null) {
        return;
      }

      const hasAccountData =
        accountCounts.expenses > 0 ||
        accountCounts.income > 0;

      setSyncRequired(
        hasDeviceData && hasAccountData,
      );
    }

    void checkSync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) {
          return;
        }

        const nextUser = session?.user ?? null;

        if (event === "SIGNED_OUT" || !nextUser) {
          setUser(null);
          setSyncRequired(false);
          setDeviceDataWarning(false);
          return;
        }

        if (event === "SIGNED_IN") {
          setUser(nextUser);
          void checkSync();
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  function chooseDeviceData() {
    setDeviceDataWarning(true);
  }

  function cancelKeepDeviceData() {
    setDeviceDataWarning(false);
  }

  function confirmKeepDeviceData() {
    if (!user) {
      return;
    }

    void (async () => {
      setIsSyncing(true);

      const localExpenses =
        loadLocalData<Expense>(EXPENSE_STORAGE_KEY);

      const localIncome =
        loadLocalData<Income>(INCOME_STORAGE_KEY);

      const existingIds =
        await getExistingAccountIds(user);

      if (!existingIds) {
        setIsSyncing(false);
        return;
      }

      const uploaded = await uploadDeviceData(
        user,
        localExpenses,
        localIncome,
      );

      if (!uploaded) {
        setIsSyncing(false);
        return;
      }

      const verified = await verifyUploadedData(
        user,
        localExpenses.length,
        localIncome.length,
      );

      if (!verified) {
        await supabase
          .from("expenses")
          .delete()
          .in("id", uploaded.expenseIds)
          .eq("user_id", user.id);

        await supabase
          .from("income")
          .delete()
          .in("id", uploaded.incomeIds)
          .eq("user_id", user.id);

        console.error(
          "Device data upload could not be verified.",
        );

        setIsSyncing(false);
        return;
      }

      const oldDataDeleted =
        await deleteOldAccountData(
          user,
          existingIds.expenses,
          existingIds.income,
        );

      if (!oldDataDeleted) {
        console.error(
          "Old account data could not be completely replaced.",
        );

        setIsSyncing(false);
        return;
      }

      clearLocalData(EXPENSE_STORAGE_KEY);
      clearLocalData(INCOME_STORAGE_KEY);

      setDeviceDataWarning(false);
      setSyncRequired(false);
      setIsSyncing(false);

      window.location.reload();
    })();
  }

  function chooseAccountData() {
    if (!user) {
      return;
    }

    void (async () => {
      setIsSyncing(true);

      const accountCounts =
        await getAccountCounts(user);

      if (accountCounts === null) {
        setIsSyncing(false);
        return;
      }

      clearLocalData(EXPENSE_STORAGE_KEY);
      clearLocalData(INCOME_STORAGE_KEY);

      setSyncRequired(false);
      setIsSyncing(false);

      window.location.reload();
    })();
  }

  return (
    <SyncContext.Provider
      value={{
        user,
        syncRequired,
        isSyncing,
        chooseDeviceData,
        chooseAccountData,
        confirmKeepDeviceData,
        cancelKeepDeviceData,
        deviceDataWarning,
      }}
    >
      {children}

      {syncRequired && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            {deviceDataWarning ? (
              <>
                <p className="text-sm font-semibold text-[var(--danger)]">
                  Warning
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Keep device data?
                </h2>

                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  Your existing account data will be
                  replaced by the data currently stored
                  on this device.
                </p>

                <p className="mt-3 text-sm font-semibold text-[var(--text)]">
                  This action cannot be undone.
                </p>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={cancelKeepDeviceData}
                    disabled={isSyncing}
                    className="secondary-button"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={confirmKeepDeviceData}
                    disabled={isSyncing}
                    className="inline-flex min-h-[42px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--danger)] bg-[var(--danger)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSyncing
                      ? "Updating..."
                      : "Yes, keep device data"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--green)]">
                  Data sync
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  You have data in both places
                </h2>

                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  We found financial data on this device
                  and in your account. Which data would
                  you like to keep?
                </p>

                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={chooseDeviceData}
                    disabled={isSyncing}
                    className="primary-button w-full"
                  >
                    Keep device data
                  </button>

                  <button
                    type="button"
                    onClick={chooseAccountData}
                    disabled={isSyncing}
                    className="secondary-button w-full"
                  >
                    Keep account data
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);

  if (!context) {
    throw new Error(
      "useSync must be used inside a SyncProvider.",
    );
  }

  return context;
}