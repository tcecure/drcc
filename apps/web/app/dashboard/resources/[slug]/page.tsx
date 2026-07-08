import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewDueBadge, VersionBadge } from "@/components/molecules/resource-card";
import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { formatResourceValue } from "@/lib/resources/options";
import { createClient } from "@/lib/supabase/server";

type ResourceDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  await requireAuthenticatedUser();
  const [{ slug }, roles] = await Promise.all([params, getUserRoles()]);
  const supabase = await createClient();
  const { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!resource) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/resources">
          Back to resources
        </Link>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
          <VersionBadge version={resource.version} />
          <span className="rounded-full border px-2 py-1 capitalize text-muted-foreground">
            {formatResourceValue(resource.resource_type)}
          </span>
          <ReviewDueBadge resource={resource} />
        </div>
        <h1 className="mt-4 text-4xl font-semibold">{resource.title}</h1>
        <p className="mt-4 leading-7 text-muted-foreground">{resource.description}</p>
      </section>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Open resource</h2>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Program area" value={resource.program_area} />
          <Detail label="Audience" value={formatResourceValue(resource.audience)} />
          <Detail label="Required role" value={resource.required_role ?? "None"} />
          <Detail label="Version" value={resource.version} />
        </dl>
        {resource.external_url ? (
          <a className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href={resource.external_url} rel="noreferrer" target="_blank">
            Open external resource
          </a>
        ) : null}
        {resource.file_path ? (
          <p className="mt-5 rounded-md border p-3 text-sm text-muted-foreground">
            File path: {resource.file_path}
          </p>
        ) : null}
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}
