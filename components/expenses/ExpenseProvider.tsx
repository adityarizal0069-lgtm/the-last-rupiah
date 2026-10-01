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
  EXPENSE_CATEGORIES,
  EXPENSE_STORAGE_KEY,
} from "@/lib/expenses";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type ExpenseInput = {
  description: string;
  amount: number;
  category: Expense["category"];
  date: string;
};

type ExpenseContextValue = {
  expenses: Expense[];
  addExpense: (expense: ExpenseInput) => void;
  updateExpense: (id: string, expense: ExpenseInput) => void;
  deleteExpense: (id: string) => void;
};

const ExpenseContext = createContext<ExpenseContextValue | undefined>(
  undefined,
);

const supabase = createSupabaseBrowserClient();

function isValidExpense(value: unknown): value is Expense {
  if (!value || typeof value !== "object") {
    return false;
  }

  const expense = value as Record<string, unknown>;

  return (
    typeof expense.id === "string" &&
    typeof expense.description === "string" &&
    expense.description.trim().length > 0 &&
    typeof expense.amount === "number" &&
    Number.isFinite(expense.amount) &&
    expense.amount >= 0 &&
    typeof expense.category === "string" &&
    EXPENSE_CATEGORIES.includes(
      expense.category as (typeof EXPENSE_CATEGORIES)[number],
    ) &&
    typeof expense.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(expense.date) &&
    typeof expense.createdAt === "string"
  );
}

function loadLocalExpenses(): Expense[] {
  try {
    const savedExpenses = window.localStorage.getItem(
      EXPENSE_STORAGE_KEY,
    );

    if (!savedExpenses) {
      return [];
    }

    const parsedExpenses: unknown = JSON.parse(savedExpenses);

    if (!Array.isArray(parsedExpenses)) {
      return [];
    }

    return parsedExpenses.filter(isValidExpense);
  } catch {
    console.error("Unable to load saved expenses.");
    return [];
  }
}

function clearLocalExpenses() {
  try {
    window.localStorage.removeItem(EXPENSE_STORAGE_KEY);
  } catch {
    console.error("Unable to clear local expenses.");
  }
}

function convertSupabaseExpense(record: {
  id: string;
  description: string;
  amount: number | string;
  category: string;
  date: string;
  created_at: string;
}): Expense | null {
  const expense: unknown = {
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

  return isValidExpense(expense) ? expense : null;
}

async function loadAccountExpenses(
  user: User,
): Promise<Expense[] | null> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load account expenses.", error);
    return null;
  }

  return data
    .map((record) =>
      convertSupabaseExpense({
        id: record.id,
        description: record.description,
        amount: record.amount,
        category: record.category,
        date: record.date,
        created_at: record.created_at,
      }),
    )
    .filter((expense): expense is Expense => expense !== null);
}

async function migrateLocalExpenses(
  user: User,
): Promise<Expense[] | null> {
  const localExpenses = loadLocalExpenses();

  if (localExpenses.length === 0) {
    return null;
  }

  const {
    data: existingExpenses,
    error: existingError,
  } = await supabase
    .from("expenses")
    .select("id")
    .eq("user_id", user.id);

  if (existingError) {
    console.error(
      "Unable to check existing account expenses.",
      existingError,
    );
    return null;
  }

  if (existingExpenses.length > 0) {
    return null;
  }

  const records = localExpenses.map((expense) => ({
    id: expense.id,
    user_id: user.id,
    description: expense.description,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    created_at: expense.createdAt,
  }));

  const { error: insertError } = await supabase
    .from("expenses")
    .insert(records);

  if (insertError) {
    console.error(
      "Unable to migrate local expenses.",
      insertError,
    );
    return null;
  }

  clearLocalExpenses();

  return localExpenses;
}

export function ExpenseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
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
        setExpenses(loadLocalExpenses());
        setIsLoaded(true);
        return;
      }

      /*
       * Load the local data before loading the account data.
       * If both exist, preserve the local data until SyncProvider
       * asks the user which dataset should be kept.
       */
      const localExpenses = loadLocalExpenses();

      const accountExpenses =
        await loadAccountExpenses(currentUser);

      if (!mounted) {
        return;
      }

      /*
       * null means Supabase failed to load.
       * Never treat an error as an empty account.
       */
      if (accountExpenses === null) {
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
        localExpenses.length > 0 &&
        accountExpenses.length > 0
      ) {
        setExpenses(localExpenses);
        setIsLoaded(true);
        return;
      }

      /*
       * If the account has no expenses but local expenses exist,
       * preserve the existing automatic migration behavior.
       */
      if (
        accountExpenses.length === 0 &&
        localExpenses.length > 0
      ) {
        const migratedExpenses =
          await migrateLocalExpenses(currentUser);

        if (!mounted) {
          return;
        }

        if (migratedExpenses) {
          setExpenses(migratedExpenses);
          setIsLoaded(true);
          return;
        }
      }

      /*
       * No conflict exists, so the account data can be loaded normally.
       */
      setExpenses(accountExpenses);
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
        setExpenses([]);
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
        EXPENSE_STORAGE_KEY,
        JSON.stringify(expenses),
      );
    } catch {
      console.error("Unable to save expenses.");
    }
  }, [expenses, isLoaded, user]);

  function addExpense(expense: ExpenseInput) {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    if (!user) {
      setExpenses((currentExpenses) => [
        newExpense,
        ...currentExpenses,
      ]);
      return;
    }

    void (async () => {
      const { error } = await supabase.from("expenses").insert({
        id: newExpense.id,
        user_id: user.id,
        description: newExpense.description,
        amount: newExpense.amount,
        category: newExpense.category,
        date: newExpense.date,
        created_at: newExpense.createdAt,
      });

      if (error) {
        console.error(
          "Unable to save account expense.",
          error,
        );
        return;
      }

      setExpenses((currentExpenses) => [
        newExpense,
        ...currentExpenses,
      ]);
    })();
  }

  function updateExpense(
    id: string,
    updatedExpense: ExpenseInput,
  ) {
    if (!user) {
      setExpenses((currentExpenses) =>
        currentExpenses.map((expense) =>
          expense.id === id
            ? {
                ...expense,
                ...updatedExpense,
              }
            : expense,
        ),
      );
      return;
    }

    void (async () => {
      const { error } = await supabase
        .from("expenses")
        .update({
          description: updatedExpense.description,
          amount: updatedExpense.amount,
          category: updatedExpense.category,
          date: updatedExpense.date,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Unable to update account expense.",
          error,
        );
        return;
      }

      setExpenses((currentExpenses) =>
        currentExpenses.map((expense) =>
          expense.id === id
            ? {
                ...expense,
                ...updatedExpense,
              }
            : expense,
        ),
      );
    })();
  }

  function deleteExpense(id: string) {
    if (!user) {
      setExpenses((currentExpenses) =>
        currentExpenses.filter(
          (expense) => expense.id !== id,
        ),
      );
      return;
    }

    void (async () => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error(
          "Unable to delete account expense.",
          error,
        );
        return;
      }

      setExpenses((currentExpenses) =>
        currentExpenses.filter(
          (expense) => expense.id !== id,
        ),
      );
    })();
  }

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);

  if (!context) {
    throw new Error(
      "useExpenses must be used inside an ExpenseProvider.",
    );
  }

  return context;
}