import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { cancelProvisioningJobAction, retryProvisioningJobAction } from "@/lib/provisioning/actions";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type ProvisioningPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function ProvisioningPage({ searchParams }: ProvisioningPageProps) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  const { data: jobs } = await supabase
    .from("provisioning_jobs")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(100);
  const userIds = [...new Set((jobs ?? []).map((job) => job.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, email, full_name, organization").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Provisioning jobs</h1>
          <p className="mt-3 text-muted-foreground">Portal-approved work for the internal AWX bridge.</p>
        </div>
        <Link className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" href="/admin/integrations">
          Integrations
        </Link>
      </section>
      {params.error ? <Message tone="error" message={params.error} /> : null}
      {params.message ? <Message tone="success" message={params.message} /> : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(jobs ?? []).map((job) => {
            const profile = profileMap.get(job.user_id);

            return (
              <article className="grid gap-4 p-5 text-sm lg:grid-cols-[1fr_1fr_auto]" key={job.id}>
                <div>
                  <Link className="font-medium text-primary hover:underline" href={`/admin/provisioning/${job.id}`}>
                    {formatJobType(job.job_type)}
                  </Link>
                  <p className="mt-1 text-muted-foreground">{profile?.full_name || profile?.email || job.user_id}</p>
                  <p className="mt-1 text-muted-foreground">{profile?.organization}</p>
                </div>
                <div>
                  <p className="font-medium capitalize">{formatStatus(job.status)}</p>
                  <p className="mt-1 text-muted-foreground">Attempts: {job.attempts}</p>
                  {job.error_message ? <p className="mt-1 text-destructive">{job.error_message}</p> : null}
                </div>
                <div className="flex flex-wrap content-start gap-2">
                  {["failed", "cancelled"].includes(job.status) ? (
                    <form action={retryProvisioningJobAction}>
                      <input type="hidden" name="jobId" value={job.id} />
                      <button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" type="submit">
                        Retry
                      </button>
                    </form>
                  ) : null}
                  {["pending_approval", "approved", "queued", "claimed", "failed"].includes(job.status) ? (
                    <form action={cancelProvisioningJobAction}>
                      <input type="hidden" name="jobId" value={job.id} />
                      <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" type="submit">
                        Cancel
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
          {jobs?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No provisioning jobs yet.</p> : null}
        </div>
      </section>
    </main>
  );
}

function Message({ tone, message }: { tone: "error" | "success"; message: string }) {
  const className =
    tone === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-primary/30 bg-primary/10 text-primary";

  return <p className={`rounded-md border p-3 text-sm ${className}`}>{message}</p>;
}

function formatJobType(value: string) {
  return value.replaceAll("_", " ");
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}
