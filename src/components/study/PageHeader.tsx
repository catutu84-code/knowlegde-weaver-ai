import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 grid size-10 place-items-center rounded-xl bg-primary/12 text-primary">
            <Icon className="size-5" />
          </span>
        ) : null}
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle ?? description ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle ?? description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface flex flex-col items-center gap-3 p-10 text-center">
      {Icon ? <Icon className="size-8 text-muted-foreground" /> : null}
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
