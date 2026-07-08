import { notFound } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { ResourceEditor } from "@/components/templates/resource-editor";
import { adminRoles, getUserRoles, requireAnyRole } from "@/lib/permissions/roles";
import { saveResourceAction } from "@/lib/resources/actions";
import { createAdminClient } from "@/lib/supabase/admin";

type EditResourcePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

type ResourceTagLink = {
  resource_tags: {
    name: string;
  } | null;
};

export default async function EditResourcePage({
  params,
  searchParams,
}: EditResourcePageProps) {
  await requireAnyRole(adminRoles);
  const [{ id }, roles, query] = await Promise.all([
    params,
    getUserRoles(),
    searchParams,
  ]);
  const supabase = createAdminClient();
  const [{ data: resource }, { data: tagLinks }] = await Promise.all([
    supabase.from("resources").select("*").eq("id", id).single(),
    supabase
      .from("resource_tag_links")
      .select("resource_tags(name)")
      .eq("resource_id", id),
  ]);

  if (!resource) {
    notFound();
  }

  const tagList = ((tagLinks ?? []) as ResourceTagLink[])
    .map((link) => link.resource_tags?.name)
    .filter(Boolean)
    .join(", ");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Edit resource</h1>
        <p className="mt-3 leading-7 text-muted-foreground">{resource.title}</p>
      </section>
      {query.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {query.error}
        </p>
      ) : null}
      {query.message ? (
        <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {query.message}
        </p>
      ) : null}
      <ResourceEditor action={saveResourceAction} resource={resource} tagList={tagList} />
    </main>
  );
}
