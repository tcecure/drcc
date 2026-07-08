import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { LabRequestForm } from "@/components/templates/lab-request-form";
import { submitLabRequestAction, userHasCompletedRequiredTraining } from "@/lib/labs/actions";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

type LabRequestPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LabRequestPage({ searchParams }: LabRequestPageProps) {
  const user = await requireAuthenticatedUser();
  const [roles, params, eligible] = await Promise.all([
    getUserRoles(),
    searchParams,
    userHasCompletedRequiredTraining(user.id),
  ]);
  const supabase = await createClient();
  const { data: tracks } = await supabase
    .from("lab_tracks")
    .select("*")
    .eq("active", true)
    .order("name");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Request lab access</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Hands-on lab access opens after required Moodle training is complete.
        </p>
      </section>
      {params.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}
      {!eligible ? (
        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Training required</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Complete the required Moodle course before requesting hands-on cyber range access.
          </p>
          <Link className="mt-4 inline-flex text-sm font-medium text-primary hover:underline" href="/dashboard/training">
            View training status
          </Link>
        </section>
      ) : tracks?.length ? (
        <LabRequestForm action={submitLabRequestAction} tracks={tracks} />
      ) : (
        <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">No active lab tracks are available yet.</p>
      )}
    </main>
  );
}
