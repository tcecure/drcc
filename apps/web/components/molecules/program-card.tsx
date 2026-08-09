import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type ProgramCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export function ProgramCard({
  title,
  description,
  href,
  icon: Icon,
}: ProgramCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-5 rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="flex size-12 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <span className="flex flex-1 flex-col gap-3">
        <span className="text-xl font-semibold">{title}</span>
        <span className="text-sm leading-6 text-muted-foreground">
          {description}
        </span>
      </span>
      <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
        Learn more
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
