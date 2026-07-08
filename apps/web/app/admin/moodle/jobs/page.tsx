import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { runMockMoodleJobAction } from "@/lib/moodle/actions";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function MoodleJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  const { data: jobs } = await supabase
    .from("integration_jobs")
    .select("*")
    .eq("integration_type", "moodle")
    .order("requested_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Moodle jobs</h1>
        <p className="mt-3 text-muted-foreground">Run pending mock jobs and inspect integration history.</p>
      </section>
      {params.error ? <Message tone="error" message={params.error} /> : null}
      {params.message ? <Message tone="success" message={params.message} /> : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(jobs ?? []).map((job) => (
            <article className="grid gap-3 p-5 text-sm lg:grid-cols-[1fr_1fr_auto]" key={job.id}>
              <div>
                <h2 className="font-medium">{job.job_type}</h2>
                <p className="text-muted-foreground">{job.entity_type} {job.entity_id}</p>
              </div>
              <div>
                <p className="capitalize">{job.status}</p>
                <p className="text-muted-foreground">Attempts: {job.attempts}</p>
              </div>
              <form action={runMockMoodleJobAction}>
                <input type="hidden" name="jobId" value={job.id} />
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
                  Run mock job
                </button>
              </form>
            </article>
          ))}
          {jobs?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No Moodle jobs yet.</p> : null}
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
