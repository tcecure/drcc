import type { LucideIcon } from "lucide-react";

type Feature = {
  title: string;
  description?: string;
  icon?: LucideIcon;
};

type FeatureGridProps = {
  features: Feature[];
  columns?: "two" | "three";
};

export function FeatureGrid({ features, columns = "three" }: FeatureGridProps) {
  const gridClass =
    columns === "two"
      ? "sm:grid-cols-2"
      : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid gap-4 ${gridClass}`}>
      {features.map((feature) => {
        const Icon = feature.icon;

        return (
          <article
            key={feature.title}
            className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm"
          >
            {Icon ? (
              <Icon className="mb-4 size-6 text-primary" aria-hidden="true" />
            ) : null}
            <h3 className="font-semibold">{feature.title}</h3>
            {feature.description ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
