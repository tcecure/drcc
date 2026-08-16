import type { ReactNode } from "react";

type DashboardCardProps = {
  children?: ReactNode;
  className?: string;
  eyebrow?: string;
  title: string;
  value?: string;
};

export function DashboardCard({
  children,
  className = "",
  eyebrow,
  title,
  value,
}: DashboardCardProps) {
  return (
    <article className={`dashboard-card ${className}`}>
      <div className="relative z-10">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            {title}
          </h2>
          {value ? (
            <p className="text-2xl font-semibold tracking-normal text-card-foreground">
              {value}
            </p>
          ) : null}
        </div>
        {children ? (
          <div className="mt-4 text-sm leading-6">{children}</div>
        ) : null}
      </div>
    </article>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function MetricCard({ helper, label, value }: MetricCardProps) {
  return (
    <DashboardCard eyebrow="Status" title={label} value={value}>
      {helper ? <p>{helper}</p> : null}
    </DashboardCard>
  );
}
