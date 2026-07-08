import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { AccessRequestForm } from "@/components/templates/access-request-form";
import { saveAccessRequestAction } from "@/lib/access/actions";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";

type NewAccessRequestPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewAccessRequestPage({
  searchParams,
}: NewAccessRequestPageProps) {
  await requireAuthenticatedUser();
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">New access request</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Save a draft while you work or submit it for approver review.
        </p>
      </section>
      {params.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}
      <AccessRequestForm action={saveAccessRequestAction} />
    </main>
  );
}
