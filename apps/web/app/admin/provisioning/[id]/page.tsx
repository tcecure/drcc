import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { cancelProvisioningJobAction, retryProvisioningJobAction } from "@/lib/provisioning/actions";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ProvisioningDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAnyRole(roleManagerRoles);
  const [{ id }, roles] = await Promise.all([params, getUserRoles()]);
  const supabase = createAdminClient();
  const { data: job } = await supabase.from("provisioning_jobs").select("*").eq("id", id).single();

  if (!job) {
    notFound();
  }

  const [{ data: profile }, { data: events }] = await Promise.all([
    supabase.from("profiles").select("email, full_name, organization").eq("id", job.user_id).single(),
    supabase
      .from("provisioning_job_events")
      .select("*")
      .eq("provisioning_job_id", job.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin/provisioning">Back to provisioning</Link>
        <h1 className="mt-4 text-4xl font-semibold">{job.job_type.replaceAll("_", " ")}</h1>
        <p className="mt-3 text-muted-foreground">{profile?.full_name || profile?.email || job.user_id}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Detail label="Status" value={job.status.replaceAll("_", " ")} />
        <Detail label="Attempts" value={String(job.attempts)} />
        <Detail label="Bridge" value={job.claimed_by ?? "Not claimed"} />
        <Detail label="Requested" value={new Date(job.requested_at).toLocaleString()} />
        <Detail label="Started" value={job.started_at ? new Date(job.started_at).toLocaleString() : "Pending"} />
        <Detail label="Completed" value={job.completed_at ? new Date(job.completed_at).toLocaleString() : "Pending"} />
      </section>
      {job.error_message ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{job.error_message}</p> : null}
      <section className="flex flex-wrap gap-2">
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
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Bridge events</h2>
        </div>
        <div className="divide-y">
          {(events ?? []).map((event) => (
            <article className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_1fr]" key={event.id}>
              <div>
                <p className="font-medium">{event.to_status.replaceAll("_", " ")}</p>
                <p className="text-muted-foreground">{event.message ?? "State transition recorded."}</p>
              </div>
              <div>
                <p>{new Date(event.created_at).toLocaleString()}</p>
                <p className="text-muted-foreground">{event.bridge_id ?? "Portal"}</p>
              </div>
            </article>
          ))}
          {events?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No bridge events yet.</p> : null}
        </div>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-sm shadow-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium capitalize">{value}</p>
    </div>
  );
}
