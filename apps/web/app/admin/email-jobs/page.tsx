import { cancelEmailJobAction, retryEmailJobAction } from "@/lib/notifications/actions";
import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type EmailJobsPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function EmailJobsPage({ searchParams }: EmailJobsPageProps) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  const { data: jobs } = await supabase
    .from("email_jobs")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(100);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Email jobs</h1>
        <p className="mt-3 text-muted-foreground">Preview mock email output and retry queued or failed transactional messages.</p>
      </section>
      {params.error ? <Message tone="error" message={params.error} /> : null}
      {params.message ? <Message tone="success" message={params.message} /> : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(jobs ?? []).map((job) => (
            <article className="grid gap-5 p-5 text-sm lg:grid-cols-[0.9fr_1.1fr_auto]" key={job.id}>
              <div>
                <h2 className="font-medium">{job.subject}</h2>
                <p className="mt-1 text-muted-foreground">{job.recipient}</p>
                <p className="mt-1 capitalize">{job.status}</p>
                <p className="mt-1 text-muted-foreground">Attempts: {job.attempts}</p>
                {job.error_message ? <p className="mt-2 text-destructive">{job.error_message}</p> : null}
              </div>
              <details className="rounded-md border bg-background p-3">
                <summary className="cursor-pointer font-medium">Preview</summary>
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                  {job.rendered_text ?? "No rendered preview available."}
                </pre>
              </details>
              <div className="flex flex-wrap content-start gap-2">
                {["queued", "failed"].includes(job.status) ? (
                  <form action={retryEmailJobAction}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" type="submit">
                      Retry/send
                    </button>
                  </form>
                ) : null}
                {["queued", "failed"].includes(job.status) ? (
                  <form action={cancelEmailJobAction}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" type="submit">
                      Cancel
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
          {jobs?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No email jobs yet.</p> : null}
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
