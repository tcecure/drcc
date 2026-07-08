import type { LucideIcon } from "lucide-react";

type ResourcePreviewCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ResourcePreviewCard({
  title,
  description,
  icon: Icon,
}: ResourcePreviewCardProps) {
  return (
    <article className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
      <Icon className="mb-5 size-6 text-primary" aria-hidden="true" />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}
