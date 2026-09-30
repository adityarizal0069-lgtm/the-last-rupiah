import Link from "next/link";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export default function EmptyState({
  icon = "○",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-green)] text-lg font-semibold text-[var(--green)]">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-[var(--text)]">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
        {description}
      </p>

      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="primary-button mt-5"
        >
          {actionLabel}
        </Link>
      ) : null}

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="primary-button mt-5"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}