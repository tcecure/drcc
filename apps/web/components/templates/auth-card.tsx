import type { ReactNode } from "react";
import Link from "next/link";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  searchParams?: {
    error?: string;
    message?: string;
  };
};

export function AuthCard({
  title,
  description,
  children,
  footer,
  searchParams,
}: AuthCardProps) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-14 sm:px-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        {searchParams?.error ? (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {searchParams.error}
          </p>
        ) : null}
        {searchParams?.message ? (
          <p className="mt-4 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
            {searchParams.message}
          </p>
        ) : null}
        <div className="mt-6">{children}</div>
        {footer ? (
          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        ) : null}
      </div>
      <Link
        href="/"
        className="mt-6 text-center text-sm font-medium text-primary hover:underline"
      >
        Back to DigitalRCC
      </Link>
    </main>
  );
}
