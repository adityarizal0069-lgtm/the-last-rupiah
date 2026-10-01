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
} from "@/lib/income";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type IncomeContextValue = {
  income: Income[];
  isLoaded: boolean;
  addIncome: (
    description: string,
    amount: number,
    category: Income["category"],
    date: string,
  ) => Promise<void>;
  updateIncome: (
    id: string,
    description: string,
    amount: number,
    category: Income["category"],
    date: string,
  ) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
};

const IncomeContext = createContext<
  IncomeContextValue | undefined
>(undefined);

const supabase = createSupabaseBrowserClient();

function loadLocalIncome(): Income[] {
  try {
    const savedData = window.localStorage.getItem(
      INCOME_STORAGE_KEY,
    );

    if (!savedData) {
      return [];
    }

    const parsedData: unknown = JSON.parse(savedData);

    if (!Array.isArray(parsedData)) {
      return [];
    }

    return parsedData as Income[];
  } catch {
    console.error(
      "[INCOME] Unable to load local income data.",
    );
    return [];
  }
}

function validateIncome(item: Income): boolean {
  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.description === "string" &&
    item.description.trim().length > 0 &&
    typeof item.amount === "number" &&
    Number.isFinite(item.amount) &&
    item.amount >= 0 &&
    typeof item.category === "string" &&
    INCOME_CATEGORIES.includes(item.category) &&
    typeof item.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    typeof item.createdAt === "string" &&
    item.createdAt.length > 0
  );
}

function convertSupabaseIncome(
  row: {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    created_at: string;
  },
): Income | null {
  const item: Income = {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    category: row.category as Income["category"],
    date: row.date,
    createdAt: row.created_at,
  };

  if (!validateIncome(item)) {
    console.error(
      "[INCOME] Invalid income record received from Supabase.",
      row,
    );
    return null;
  }

  return item;
}

async function loadAccountIncome(
  user: User,
): Promise<Income[] | null> {
  const { data, error } = await supabase
    .from("income")
    .select(
      "id, description, amount, category, date, created_at",
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[INCOME] Unable to load account income.",
      error,
    );
    return null;
  }

  const convertedIncome = data
    .map(convertSupabaseIncome)
    .filter(
      (item): item is Income => item !== null,
    );

  return convertedIncome;
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

      const localIncome = loadLocalIncome();

      /*
       * If device income exists after sign-in, keep it visible.
       *
       * SyncProvider is the sole authority for deciding whether
       * device data should replace account data. This provider
       * must not automatically migrate or delete local data.
       */
      if (localIncome.length > 0) {
        setIncome(localIncome);
        setIsLoaded(true);
        return;
      }

      /*
       * There is no local income data, so it is safe to load the
       * account data normally.
       */
      const accountIncome =
        await loadAccountIncome(currentUser);

      if (!mounted) {
        return;
      }

      if (accountIncome === null) {
        setIsLoaded(true);
        return;
      }

      setIncome(accountIncome);
      setIsLoaded(true);
    }

    void initialize();

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
          setIncome([]);
          setIsLoaded(true);
          return;
        }

        if (event === "SIGNED_IN") {
          setUser(nextUser);
          void initialize();
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    /*
     * Local storage belongs to signed-out device data.
     *
     * Once signed in, SyncProvider is responsible for deciding
     * whether device data should be uploaded or discarded.
     * Therefore this provider must never write signed-in state
     * back into localStorage.
     */
    if (!isLoaded || user) {
      return;
    }

    try {
      window.localStorage.setItem(
        INCOME_STORAGE_KEY,
        JSON.stringify(income),
      );
    } catch {
      console.error(
        "[INCOME] Unable to save income data locally.",
      );
    }
  }, [income, isLoaded, user]);

  async function addIncome(
    description: string,
    amount: number,
    category: Income["category"],
    date: string,
  ) {
    const trimmedDescription = description.trim();

    if (
      !trimmedDescription ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !INCOME_CATEGORIES.includes(category) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      throw new Error("Invalid income data.");
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const now = new Date().toISOString();
    const newIncomeId = crypto.randomUUID();

    if (!currentUser) {
      const newIncome: Income = {
        id: newIncomeId,
        description: trimmedDescription,
        amount,
        category,
        date,
        createdAt: now,
      };

      setIncome((current) => [newIncome, ...current]);
      return;
    }

    const { data, error } = await supabase
      .from("income")
      .insert({
        id: newIncomeId,
        user_id: currentUser.id,
        description: trimmedDescription,
        amount,
        category,
        date,
        created_at: now,
      })
      .select(
        "id, description, amount, category, date, created_at",
      )
      .single();

    if (error) {
      console.error(
        "[INCOME] Unable to add account income.",
        error,
      );
      throw error;
    }

    const newIncome = convertSupabaseIncome(data);

    if (!newIncome) {
      throw new Error(
        "The saved income record was invalid.",
      );
    }

    setIncome((current) => [newIncome, ...current]);
  }

  async function updateIncome(
    id: string,
    description: string,
    amount: number,
    category: Income["category"],
    date: string,
  ) {
    const trimmedDescription = description.trim();

    if (
      !id ||
      !trimmedDescription ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !INCOME_CATEGORIES.includes(category) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      throw new Error("Invalid income data.");
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setIncome((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                description: trimmedDescription,
                amount,
                category,
                date,
              }
            : item,
        ),
      );

      return;
    }

    const { data, error } = await supabase
      .from("income")
      .update({
        description: trimmedDescription,
        amount,
        category,
        date,
      })
      .eq("id", id)
      .eq("user_id", currentUser.id)
      .select(
        "id, description, amount, category, date, created_at",
      )
      .single();

    if (error) {
      console.error(
        "[INCOME] Unable to update account income.",
        error,
      );
      throw error;
    }

    const updatedIncome = convertSupabaseIncome(data);

    if (!updatedIncome) {
      throw new Error(
        "The updated income record was invalid.",
      );
    }

    setIncome((current) =>
      current.map((item) =>
        item.id === id ? updatedIncome : item,
      ),
    );
  }

  async function deleteIncome(id: string) {
    if (!id) {
      return;
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setIncome((current) =>
        current.filter((item) => item.id !== id),
      );
      return;
    }

    const { error } = await supabase
      .from("income")
      .delete()
      .eq("id", id)
      .eq("user_id", currentUser.id);

    if (error) {
      console.error(
        "[INCOME] Unable to delete account income.",
        error,
      );
      throw error;
    }

    setIncome((current) =>
      current.filter((item) => item.id !== id),
    );
  }

  return (
    <IncomeContext.Provider
      value={{
        income,
        isLoaded,
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