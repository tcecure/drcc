import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { ResourceEditor } from "@/components/templates/resource-editor";
import { adminRoles, getUserRoles, requireAnyRole } from "@/lib/permissions/roles";
import { saveResourceAction } from "@/lib/resources/actions";

type NewResourcePageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewResourcePage({ searchParams }: NewResourcePageProps) {
  await requireAnyRole(adminRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">New resource</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Add a guide, checklist, policy, template, or external resource link.
        </p>
      </section>
      {params.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}
      <ResourceEditor action={saveResourceAction} />
    </main>
  );
}
