"use client";

type MonthlySelectorProps = {
  monthKeys: string[];
  selectedMonth: string;
  onChange: (monthKey: string) => void;
};

function formatMonth(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

export default function MonthlySelector({
  monthKeys,
  selectedMonth,
  onChange,
}: MonthlySelectorProps) {
  return (
    <div className="surface p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--text-light)]">
            View month
          </p>

          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Choose a month to explore your financial activity.
          </p>
        </div>

        <select
          value={selectedMonth}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-dark)] bg-white px-3.5 text-sm font-semibold outline-none transition focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green-light)] sm:w-[220px]"
          aria-label="Select month"
        >
          {monthKeys.map((monthKey) => (
            <option key={monthKey} value={monthKey}>
              {formatMonth(monthKey)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}