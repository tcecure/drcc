import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { completeLabAssignmentAction, requestLabVerificationAction } from "@/lib/labs/experience-actions";
import { formatLabValue } from "@/lib/labs/queue";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

type CurrentLabPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function CurrentLabPage({ searchParams }: CurrentLabPageProps) {
  const user = await requireAuthenticatedUser();
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("lab_assignments")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["reserved", "provisioning", "active"])
    .order("created_at", { ascending: false });
  const instanceIds = [...new Set((assignments ?? []).map((assignment) => assignment.lab_instance_id))];
  const { data: instances } = instanceIds.length
    ? await supabase.from("lab_instances").select("*").in("id", instanceIds)
    : { data: [] };
  const assignmentIds = (assignments ?? []).map((assignment) => assignment.id);
  const { data: provisioningJobs } = assignmentIds.length
    ? await supabase
        .from("provisioning_jobs")
        .select("id, lab_assignment_id, job_type, status, requested_at, completed_at")
        .in("lab_assignment_id", assignmentIds)
        .order("requested_at", { ascending: true })
    : { data: [] };
  const { data: verifications } = assignmentIds.length
    ? await supabase
        .from("lab_verifications")
        .select("*")
        .in("lab_assignment_id", assignmentIds)
        .order("requested_at", { ascending: false })
    : { data: [] };
  const trackIds = [...new Set((instances ?? []).map((instance) => instance.lab_track_id))];
  const { data: tracks } = trackIds.length
    ? await supabase.from("lab_tracks").select("id, name, slug").in("id", trackIds)
    : { data: [] };
  const instanceMap = new Map((instances ?? []).map((instance) => [instance.id, instance]));
  const trackMap = new Map((tracks ?? []).map((track) => [track.id, track]));
  const jobsByAssignment = new Map<string, typeof provisioningJobs>();
  const verificationsByAssignment = new Map<string, typeof verifications>();

  for (const job of provisioningJobs ?? []) {
    if (!job.lab_assignment_id) {
      continue;
    }

    jobsByAssignment.set(job.lab_assignment_id, [...(jobsByAssignment.get(job.lab_assignment_id) ?? []), job]);
  }
  for (const verification of verifications ?? []) {
    verificationsByAssignment.set(verification.lab_assignment_id, [
      ...(verificationsByAssignment.get(verification.lab_assignment_id) ?? []),
      verification,
    ]);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Current lab</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Review your assigned lab slot and expiration details.
        </p>
      </section>
      {params.message ? (
        <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{params.message}</p>
      ) : null}
      {params.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{params.error}</p>
      ) : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(assignments ?? []).map((assignment) => {
            const instance = instanceMap.get(assignment.lab_instance_id);
            const track = instance ? trackMap.get(instance.lab_track_id) : null;
            const assignmentJobs = jobsByAssignment.get(assignment.id) ?? [];
            const assignmentVerifications = verificationsByAssignment.get(assignment.id) ?? [];
            const latestVerification = assignmentVerifications[0];
            const hasPassedVerification = assignmentVerifications.some((verification) => verification.status === "passed");

            return (
              <article className="grid gap-6 p-5 text-sm lg:grid-cols-[1.2fr_0.8fr]" key={assignment.id}>
                <div>
                  <h2 className="font-medium">{instance?.pod_name ?? "Lab pod"}</h2>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Detail label="Lab track" value={track?.name ?? "Assigned track"} />
                    <Detail label="Status" value={formatLabValue(assignment.status)} />
                    <Detail label="Starts" value={assignment.starts_at ? new Date(assignment.starts_at).toLocaleString() : "Pending"} />
                    <Detail label="Expires" value={assignment.expires_at ? new Date(assignment.expires_at).toLocaleString() : "Pending"} />
                    <Detail label="Guacamole" value={assignment.status === "active" ? "Available through controlled workspace" : "Available after provisioning"} />
                    <Detail label="VPN" value="Required when assigned by staff" />
                  </dl>
                  <div className="mt-5 rounded-md border bg-background p-4">
                    <h3 className="font-medium">Lab guide</h3>
                    <p className="mt-2 text-muted-foreground">
                      Follow the assigned DigitalRCC lab guide in the resources area. Keep acceptable use rules active for every session.
                    </p>
                    <Link className="mt-3 inline-flex font-medium text-primary hover:underline" href="/dashboard/resources">
                      Open resources
                    </Link>
                  </div>
                  <div className="mt-5 rounded-md border bg-background p-4">
                    <h3 className="font-medium">Connectivity test</h3>
                    <p className="mt-2 text-muted-foreground">
                      Confirm browser access, MFA readiness, and VPN connectivity before starting hands-on tasks.
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <form action={requestLabVerificationAction}>
                      <input type="hidden" name="assignmentId" value={assignment.id} />
                      <input type="hidden" name="verificationType" value="check_progress" />
                      <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" type="submit">
                        Check progress
                      </button>
                    </form>
                    <form action={requestLabVerificationAction}>
                      <input type="hidden" name="assignmentId" value={assignment.id} />
                      <input type="hidden" name="verificationType" value="verify_lab" />
                      <button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" type="submit">
                        Verify lab
                      </button>
                    </form>
                    {hasPassedVerification && assignment.status === "active" ? (
                      <form action={completeLabAssignmentAction}>
                        <input type="hidden" name="assignmentId" value={assignment.id} />
                        <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" type="submit">
                          Complete lab
                        </button>
                      </form>
                    ) : null}
                    <Link className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/support/new">
                      Support
                    </Link>
                  </div>
                </div>
                <div>
                  <div className="rounded-md border bg-background p-4">
                    <h3 className="font-medium">Verification status</h3>
                    <p className="mt-2 capitalize text-muted-foreground">
                      {latestVerification ? latestVerification.status.replaceAll("_", " ") : "Not started"}
                    </p>
                    {latestVerification?.score !== null && latestVerification?.score !== undefined ? (
                      <p className="mt-1 text-muted-foreground">Score: {latestVerification.score}</p>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-2">
                    {assignmentJobs.map((job) => (
                      <div className="rounded-md border bg-background p-3" key={job.id}>
                        <p className="font-medium capitalize">{job.job_type.replaceAll("_", " ")}</p>
                        <p className="mt-1 text-muted-foreground capitalize">{job.status.replaceAll("_", " ")}</p>
                      </div>
                    ))}
                    {assignmentJobs.length === 0 ? (
                      <p className="text-muted-foreground">Provisioning has not started yet.</p>
                    ) : null}
                  </div>
                  <div className="mt-4 rounded-md border bg-background p-4">
                    <h3 className="font-medium">Acceptable use</h3>
                    <p className="mt-2 text-muted-foreground">
                      Use only your assigned lab. Do not share access, credentials, screenshots, or infrastructure details.
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
          {assignments?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No current lab assignment.</p> : null}
        </div>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium capitalize">{value}</dd>
    </div>
  );
}
