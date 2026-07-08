import Link from "next/link";

import { ResourceCard } from "@/components/molecules/resource-card";
import { DashboardNav } from "@/components/organisms/dashboard-nav";
import {
  resourceAudienceOptions,
  resourceTypeOptions,
  type Resource,
} from "@/lib/resources/options";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

type DashboardResourcesPageProps = {
  searchParams: Promise<{
    type?: Resource["resource_type"];
    audience?: Resource["audience"];
    q?: string;
  }>;
};

export default async function DashboardResourcesPage({
  searchParams,
}: DashboardResourcesPageProps) {
  await requireAuthenticatedUser();
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = await createClient();
  let query = supabase
    .from("resources")
    .select("*")
    .eq("status", "published")
    .order("effective_date", { ascending: false });

  if (params.type) {
    query = query.eq("resource_type", params.type);
  }

  if (params.audience) {
    query = query.eq("audience", params.audience);
  }

  const { data: resources } = await query;
  const filteredResources = (resources ?? []).filter((resource) => {
    if (!params.q) {
      return true;
    }

    return [resource.title, resource.description, resource.program_area]
      .join(" ")
      .toLowerCase()
      .includes(params.q.toLowerCase());
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Resource library</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Find student guides, lab guides, checklists, policies, references, and templates available to your role.
          </p>
        </div>
        <Link className="text-sm font-medium text-primary hover:underline" href="/resources">
          Public resources
        </Link>
      </section>
      <form className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_1fr_1.5fr_auto]">
        <select className="h-11 rounded-md border bg-background px-3 text-sm" name="type" defaultValue={params.type ?? ""}>
          <option value="">All types</option>
          {resourceTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select className="h-11 rounded-md border bg-background px-3 text-sm" name="audience" defaultValue={params.audience ?? ""}>
          <option value="">All audiences</option>
          {resourceAudienceOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input className="h-11 rounded-md border bg-background px-3 text-sm" name="q" placeholder="Search resources" defaultValue={params.q ?? ""} />
        <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
          Filter
        </button>
      </form>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredResources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} href={`/dashboard/resources/${resource.slug}`} />
        ))}
        {filteredResources.length === 0 ? (
          <p className="col-span-full rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            No resources match the current filters.
          </p>
        ) : null}
      </section>
    </main>
  );
}
