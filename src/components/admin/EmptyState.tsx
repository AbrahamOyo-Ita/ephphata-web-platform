import Link from "next/link";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondary,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  action?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <div className="rounded-sm border border-dashed border-ink-900/15 bg-white px-6 py-14 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xs bg-paper-100">
        <Icon className="h-5 w-5 text-ink-400" strokeWidth={1.8} />
      </span>
      <h3 className="mt-4 text-[0.875rem] font-semibold text-ink-800">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-[0.8125rem] leading-relaxed text-ink-500">
        {description}
      </p>
      {(action || secondary) && (
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {action && (
            <Link href={action.href} className="btn-ink btn-sm">
              {action.label}
            </Link>
          )}
          {secondary && (
            <Link href={secondary.href} className="btn-outline btn-sm">
              {secondary.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
