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
      `[SYNC] Unable to load local data for ${storageKey}.`,
    );
    return [];
  }
}

function clearLocalData(storageKey: string) {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    console.error(
      `[SYNC] Unable to clear local data for ${storageKey}.`,
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
      "[SYNC] Unable to check account expenses.",
      expenseError,
    );
    return null;
  }

  if (incomeError) {
    console.error(
      "[SYNC] Unable to check account income.",
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
      "[SYNC] Unable to read existing account expenses.",
      expenseError,
    );
    return null;
  }

  if (incomeError) {
    console.error(
      "[SYNC] Unable to read existing account income.",
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
  console.log("[SYNC] Starting device data upload.");
  console.log("[SYNC] Device expenses:", expenses.length);
  console.log("[SYNC] Device income:", income.length);

  console.log(
    "[SYNC] Device expense data:",
    expenses,
  );

  console.log(
    "[SYNC] Device income data:",
    income,
  );

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

  console.log(
    "[SYNC] Prepared expense records:",
    expenseRecords,
  );

  console.log(
    "[SYNC] Prepared income records:",
    incomeRecords,
  );

  if (expenseRecords.length > 0) {
    console.log(
      "[SYNC] Attempting expense insert:",
      expenseRecords.length,
    );

    const { data, error } = await supabase
      .from("expenses")
      .insert(expenseRecords)
      .select();

    if (error) {
      console.error(
        "[SYNC] EXPENSE INSERT FAILED.",
        error,
      );

      console.error(
        "[SYNC] Expense error message:",
        error.message,
      );

      console.error(
        "[SYNC] Expense error details:",
        error.details,
      );

      console.error(
        "[SYNC] Expense error hint:",
        error.hint,
      );

      console.error(
        "[SYNC] Expense error code:",
        error.code,
      );

      return null;
    }

    console.log(
      "[SYNC] EXPENSE INSERT SUCCEEDED.",
      data,
    );
  } else {
    console.log(
      "[SYNC] No device expenses to upload.",
    );
  }

  if (incomeRecords.length > 0) {
    console.log(
      "[SYNC] Attempting income insert:",
      incomeRecords.length,
    );

    const { data, error } = await supabase
      .from("income")
      .insert(incomeRecords)
      .select();

    if (error) {
      console.error(
        "[SYNC] INCOME INSERT FAILED.",
        error,
      );

      console.error(
        "[SYNC] Income error message:",
        error.message,
      );

      console.error(
        "[SYNC] Income error details:",
        error.details,
      );

      console.error(
        "[SYNC] Income error hint:",
        error.hint,
      );

      console.error(
        "[SYNC] Income error code:",
        error.code,
      );

      if (expenseRecords.length > 0) {
        console.log(
          "[SYNC] Rolling back uploaded expenses.",
        );

        const { error: rollbackError } =
          await supabase
            .from("expenses")
            .delete()
            .in(
              "id",
              expenseRecords.map(
                (record) => record.id,
              ),
            )
            .eq("user_id", user.id);

        if (rollbackError) {
          console.error(
            "[SYNC] Expense rollback failed.",
            rollbackError,
          );
        } else {
          console.log(
            "[SYNC] Expense rollback succeeded.",
          );
        }
      }

      return null;
    }

    console.log(
      "[SYNC] INCOME INSERT SUCCEEDED.",
      data,
    );
  } else {
    console.log(
      "[SYNC] No device income to upload.",
    );
  }

  console.log(
    "[SYNC] Device data upload completed.",
  );

  return {
    expenseIds: expenseRecords.map(
      (record) => record.id,
    ),
    incomeIds: incomeRecords.map(
      (record) => record.id,
    ),
  };
}

async function verifyUploadedData(
  user: User,
  expectedExpenseCount: number,
  expectedIncomeCount: number,
) {
  console.log(
    "[SYNC] Verifying uploaded data.",
  );

  console.log(
    "[SYNC] Expected expenses:",
    expectedExpenseCount,
  );

  console.log(
    "[SYNC] Expected income:",
    expectedIncomeCount,
  );

  const counts = await getAccountCounts(user);

  if (!counts) {
    console.error(
      "[SYNC] Verification could not read account counts.",
    );
    return false;
  }

  console.log(
    "[SYNC] Account counts after upload:",
    counts,
  );

  const verified =
    counts.expenses >= expectedExpenseCount &&
    counts.income >= expectedIncomeCount;

  console.log(
    "[SYNC] Verification result:",
    verified,
  );

  return verified;
}

async function deleteOldAccountData(
  user: User,
  oldExpenseIds: string[],
  oldIncomeIds: string[],
) {
  console.log(
    "[SYNC] Removing old account data.",
  );

  console.log(
    "[SYNC] Old expense count:",
    oldExpenseIds.length,
  );

  console.log(
    "[SYNC] Old income count:",
    oldIncomeIds.length,
  );

  if (oldExpenseIds.length > 0) {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .in("id", oldExpenseIds)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "[SYNC] Unable to remove old account expenses.",
        error,
      );
      return false;
    }

    console.log(
      "[SYNC] Old account expenses removed.",
    );
  }

  if (oldIncomeIds.length > 0) {
    const { error } = await supabase
      .from("income")
      .delete()
      .in("id", oldIncomeIds)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "[SYNC] Unable to remove old account income.",
        error,
      );
      return false;
    }

    console.log(
      "[SYNC] Old account income removed.",
    );
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
      console.error(
        "[SYNC] Cannot keep device data because there is no user.",
      );
      return;
    }

    void (async () => {
      setIsSyncing(true);

      console.log(
        "[SYNC] ===== KEEP DEVICE DATA STARTED =====",
      );

      const localExpenses =
        loadLocalData<Expense>(EXPENSE_STORAGE_KEY);

      const localIncome =
        loadLocalData<Income>(INCOME_STORAGE_KEY);

      console.log(
        "[SYNC] Local expenses loaded:",
        localExpenses.length,
      );

      console.log(
        "[SYNC] Local income loaded:",
        localIncome.length,
      );

      const existingIds =
        await getExistingAccountIds(user);

      if (!existingIds) {
        console.error(
          "[SYNC] Could not get existing account IDs.",
        );
        setIsSyncing(false);
        return;
      }

      console.log(
        "[SYNC] Existing account expenses:",
        existingIds.expenses.length,
      );

      console.log(
        "[SYNC] Existing account income:",
        existingIds.income.length,
      );

      const uploaded = await uploadDeviceData(
        user,
        localExpenses,
        localIncome,
      );

      if (!uploaded) {
        console.error(
          "[SYNC] Device upload failed.",
        );
        setIsSyncing(false);
        return;
      }

      console.log(
        "[SYNC] Uploaded expense IDs:",
        uploaded.expenseIds,
      );

      console.log(
        "[SYNC] Uploaded income IDs:",
        uploaded.incomeIds,
      );

      const verified = await verifyUploadedData(
        user,
        localExpenses.length,
        localIncome.length,
      );

      if (!verified) {
        console.error(
          "[SYNC] Device data upload could not be verified. Starting cleanup.",
        );

        if (uploaded.expenseIds.length > 0) {
          const { error } = await supabase
            .from("expenses")
            .delete()
            .in("id", uploaded.expenseIds)
            .eq("user_id", user.id);

          if (error) {
            console.error(
              "[SYNC] Failed to clean up uploaded expenses.",
              error,
            );
          }
        }

        if (uploaded.incomeIds.length > 0) {
          const { error } = await supabase
            .from("income")
            .delete()
            .in("id", uploaded.incomeIds)
            .eq("user_id", user.id);

          if (error) {
            console.error(
              "[SYNC] Failed to clean up uploaded income.",
              error,
            );
          }
        }

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
          "[SYNC] Old account data could not be completely replaced.",
        );

        setIsSyncing(false);
        return;
      }

      clearLocalData(EXPENSE_STORAGE_KEY);
      clearLocalData(INCOME_STORAGE_KEY);

      console.log(
        "[SYNC] Local expense storage cleared.",
      );

      console.log(
        "[SYNC] Local income storage cleared.",
      );

      setDeviceDataWarning(false);
      setSyncRequired(false);
      setIsSyncing(false);

      console.log(
        "[SYNC] ===== KEEP DEVICE DATA COMPLETED =====",
      );

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