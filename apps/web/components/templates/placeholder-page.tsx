import type { ReactNode } from "react";

type PlaceholderPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPage({
  title,
  description,
  children,
}: PlaceholderPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="max-w-3xl text-base leading-7 text-muted-foreground">
        {description}
      </p>
      {children ? (
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          {children}
        </div>
      ) : null}
    </main>
  );
}
