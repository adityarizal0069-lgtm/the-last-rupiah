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
  Income,
  INCOME_CATEGORIES,
  INCOME_STORAGE_KEY,
  type IncomeCategory,
} from "@/lib/income";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type IncomeInput = {
  description: string;
  amount: number;
  category: IncomeCategory;
  date: string;
};

type IncomeContextValue = {
  income: Income[];
  addIncome: (income: IncomeInput) => void;
  updateIncome: (id: string, income: IncomeInput) => void;
  deleteIncome: (id: string) => void;
};

const IncomeContext = createContext<IncomeContextValue | undefined>(
  undefined,
);

const supabase = createSupabaseBrowserClient();

function isValidIncome(value: unknown): value is Income {
  if (!value || typeof value !== "object") {
    return false;
  }

  const income = value as Record<string, unknown>;

  return (
    typeof income.id === "string" &&
    typeof income.description === "string" &&
    income.description.trim().length > 0 &&
    typeof income.amount === "number" &&
    Number.isFinite(income.amount) &&
    income.amount >= 0 &&
    typeof income.category === "string" &&
    INCOME_CATEGORIES.includes(
      income.category as (typeof INCOME_CATEGORIES)[number],
    ) &&
    typeof income.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(income.date) &&
    typeof income.createdAt === "string"
  );
}

function loadLocalIncome(): Income[] {
  try {
    const savedIncome = window.localStorage.getItem(
      INCOME_STORAGE_KEY,
    );

    if (!savedIncome) {
      return [];
    }

    const parsedIncome: unknown = JSON.parse(savedIncome);

    if (!Array.isArray(parsedIncome)) {
      return [];
    }

    return parsedIncome.filter(isValidIncome);
  } catch {
    console.error("Unable to load saved income.");
    return [];
  }
}

function clearLocalIncome() {
  try {
    window.localStorage.removeItem(INCOME_STORAGE_KEY);
  } catch {
    console.error("Unable to clear local income.");
  }
}

function convertSupabaseIncome(record: {
  id: string;
  description: string;
  amount: number | string;
  category: string;
  date: string;
  created_at: string;
}): Income | null {
  const income: unknown = {
    id: record.id,
    description: record.description,
    amount:
      typeof record.amount === "number"
        ? record.amount
        : Number(record.amount),
    category: record.category,
    date: record.date,
    createdAt: record.created_at,
  };

  return isValidIncome(income) ? income : null;
}

async function loadAccountIncome(
  user: User,
): Promise<Income[] | null> {
  const { data, error } = await supabase
    .from("income")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load account income.", error);
    return null;
  }

  return data
    .map((record) =>
      convertSupabaseIncome({
        id: record.id,
        description: record.description,
        amount: record.amount,
        category: record.category,
        date: record.date,
        created_at: record.created_at,
      }),
    )
    .filter((item): item is Income => item !== null);
}

async function migrateLocalIncome(
  user: User,
): Promise<Income[] | null> {
  const localIncome = loadLocalIncome();

  if (localIncome.length === 0) {
    return null;
  }

  const {
    data: existingIncome,
    error: existingError,
  } = await supabase
    .from("income")
    .select("id")
    .eq("user_id", user.id);

  if (existingError) {
    console.error(
      "Unable to check existing account income.",
      existingError,
    );
    return null;
  }

  if (existingIncome.length > 0) {
    return null;
  }

  const records = localIncome.map((item) => ({
    id: item.id,
    user_id: user.id,
    description: item.description,
    amount: item.amount,
    category: item.category,
    date: item.date,
    created_at: item.createdAt,
  }));

  const { error: insertError } = await supabase
    .from("income")
    .insert(records);

  if (insertError) {
    console.error(
      "Unable to migrate local income.",
      insertError,
    );
    return null;
  }

  clearLocalIncome();

  return localIncome;
}

export function IncomeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [income, setIncome] = useState<Income[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setIsLoaded(false);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!mounted) {
        return;
      }

      setUser(currentUser);

      if (!currentUser) {
        setIncome(loadLocalIncome());
        setIsLoaded(true);
        return;
      }

      /*
       * Load the local data before loading the account data.
       * If both exist, preserve the local data until SyncProvider
       * asks the user which dataset should be kept.
       */
      const localIncome = loadLocalIncome();

      const accountIncome =
        await loadAccountIncome(currentUser);

      if (!mounted) {
        return;
      }

      /*
       * null means Supabase failed to load.
       * Never treat an error as an empty account.
       */
      if (accountIncome === null) {
        setIsLoaded(true);
        return;
      }

      /*
       * When both device and account data exist, do not silently
       * replace the device data with account data.
       *
       * SyncProvider detects the same conflict and displays the
       * explicit Keep device data / Keep account data choice.
       */
      if (
        localIncome.length > 0 &&
        accountIncome.length > 0
      ) {
        setIncome(localIncome);
        setIsLoaded(true);
        return;
      }

      /*
       * If the account has no income but local income exists,
       * preserve the existing automatic migration behavior.
       */
      if (
        accountIncome.length === 0 &&
        localIncome.length > 0
      ) {
        const migratedIncome =
          await migrateLocalIncome(currentUser);

        if (!mounted) {
          return;
        }

        if (migratedIncome) {
          setIncome(migratedIncome);
          setIsLoaded(true);
          return;
        }
      }

      /*
       * No conflict exists, so the account data can be loaded normally.
       */
      setIncome(accountIncome);
      setIsLoaded(true);
    }

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) {
        return;
      }

      const nextUser = session?.user ?? null;

      if (event === "SIGNED_OUT" || !nextUser) {
        setUser(null);
        setIncome([]);
        setIsLoaded(true);
        return;
      }

      if (event === "SIGNED_IN") {
        setUser(nextUser);
        void initialize();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || user) {
      return;
    }

    try {
      window.localStorage.setItem(
        INCOME_STORAGE_KEY,
        JSON.stringify(income),
      );
    } catch {
      console.error("Unable to save income.");
    }
  }, [income, isLoaded, user]);

  function addIncome(newIncome: IncomeInput) {
    const incomeRecord: Income = {
      ...newIncome,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    if (!user) {
      setIncome((currentIncome) => [
        incomeRecord,
        ...currentIncome,
      ]);
      return;
    }

    void (async () => {
      const { error } = await supabase.from("income").insert({
        id: incomeRecord.id,
        user_id: user.id,
        description: incomeRecord.description,
        amount: incomeRecord.amount,
        category: incomeRecord.category,
        date: incomeRecord.date,
        created_at: incomeRecord.createdAt,
      });

      if (error) {
        console.error(
          "Unable to save account income.",
          error,
        );
        return;
      }

      setIncome((currentIncome) => [
        incomeRecord,
        ...currentIncome,
      ]);
    })();
  }

  function updateIncome(
    id: string,
    updatedIncome: IncomeInput,
  ) {
    if (!user) {
      setIncome((currentIncome) =>
        currentIncome.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updatedIncome,
              }
            : item,
        ),
      );
      return;
    }

    void (async () => {
      const { error } = await supabase
        .from("income")
        .update({
          description: updatedIncome.description,
          amount: updatedIncome.amount,
          category: updatedIncome.category,
          date: updatedIncome.date,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Unable to update account income.",
          error,
        );
        return;
      }

      setIncome((currentIncome) =>
        currentIncome.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updatedIncome,
              }
            : item,
        ),
      );
    })();
  }

  function deleteIncome(id: string) {
    if (!user) {
      setIncome((currentIncome) =>
        currentIncome.filter((item) => item.id !== id),
      );
      return;
    }

    void (async () => {
      const { error } = await supabase
        .from("income")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Unable to delete account income.",
          error,
        );
        return;
      }

      setIncome((currentIncome) =>
        currentIncome.filter((item) => item.id !== id),
      );
    })();
  }

  return (
    <IncomeContext.Provider
      value={{
        income,
        addIncome,
        updateIncome,
        deleteIncome,
      }}
    >
      {children}
    </IncomeContext.Provider>
  );
}

export function useIncome() {
  const context = useContext(IncomeContext);

  if (!context) {
    throw new Error(
      "useIncome must be used inside an IncomeProvider.",
    );
  }

  return context;
}