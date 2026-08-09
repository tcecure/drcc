import Link from "next/link";

import {
  formatResourceValue,
  isReviewDue,
  type Resource,
} from "@/lib/resources/options";

type ResourceCardProps = {
  resource: Resource;
  href: string;
  showStatus?: boolean;
};

export function ResourceCard({ resource, href, showStatus = false }: ResourceCardProps) {
  return (
    <Link className="rounded-lg border bg-card p-5 shadow-sm transition-colors hover:bg-muted/60" href={href}>
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <VersionBadge version={resource.version} />
        <span className="rounded-full border px-2 py-1 capitalize text-muted-foreground">
          {formatResourceValue(resource.resource_type)}
        </span>
        {showStatus ? (
          <span className="rounded-full border px-2 py-1 capitalize text-muted-foreground">
            {formatResourceValue(resource.status)}
          </span>
        ) : null}
        <ReviewDueBadge resource={resource} />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{resource.title}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
        {resource.description}
      </p>
      <p className="mt-4 text-sm font-medium capitalize">
        {resource.program_area}
      </p>
    </Link>
  );
}

export function VersionBadge({ version }: { version: string }) {
  return <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">v{version}</span>;
}

export function ReviewDueBadge({ resource }: { resource: Resource }) {
  if (!resource.review_due_at) {
    return null;
  }

  return (
    <span className={`rounded-full px-2 py-1 ${isReviewDue(resource) ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
      {isReviewDue(resource) ? "Review due" : "Review scheduled"}
    </span>
  );
}
