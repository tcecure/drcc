import Link from "next/link";

import { ResourceCard } from "@/components/molecules/resource-card";
import { DashboardNav } from "@/components/organisms/dashboard-nav";
import {
  resourceStatusOptions,
  resourceTypeOptions,
  type Resource,
} from "@/lib/resources/options";
import { adminRoles, getUserRoles, requireAnyRole } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminResourcesPageProps = {
  searchParams: Promise<{
    status?: Resource["status"];
    type?: Resource["resource_type"];
    q?: string;
  }>;
};

export default async function AdminResourcesPage({
  searchParams,
}: AdminResourcesPageProps) {
  await requireAnyRole(adminRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  let query = supabase
    .from("resources")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.type) {
    query = query.eq("resource_type", params.type);
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
          <h1 className="text-4xl font-semibold">Resource management</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Create, review, publish, archive, and maintain DigitalRCC student and lab resources.
          </p>
        </div>
        <Link className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href="/admin/resources/new">
          New resource
        </Link>
      </section>
      <form className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_1fr_1.5fr_auto]">
        <select className="h-11 rounded-md border bg-background px-3 text-sm" name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          {resourceStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select className="h-11 rounded-md border bg-background px-3 text-sm" name="type" defaultValue={params.type ?? ""}>
          <option value="">All types</option>
          {resourceTypeOptions.map((option) => (
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
          <ResourceCard key={resource.id} resource={resource} href={`/admin/resources/${resource.id}/edit`} showStatus />
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
