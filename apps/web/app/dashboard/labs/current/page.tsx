import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { formatLabValue } from "@/lib/labs/queue";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

type CurrentLabPageProps = {
  searchParams: Promise<{ message?: string }>;
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
  const instanceMap = new Map((instances ?? []).map((instance) => [instance.id, instance]));
  const jobsByAssignment = new Map<string, typeof provisioningJobs>();

  for (const job of provisioningJobs ?? []) {
    if (!job.lab_assignment_id) {
      continue;
    }

    jobsByAssignment.set(job.lab_assignment_id, [...(jobsByAssignment.get(job.lab_assignment_id) ?? []), job]);
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
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(assignments ?? []).map((assignment) => {
            const instance = instanceMap.get(assignment.lab_instance_id);

            return (
              <article className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_auto]" key={assignment.id}>
                <div>
                  <h2 className="font-medium">{instance?.pod_name ?? "Lab pod"}</h2>
                  <p className="mt-1 text-muted-foreground">Expires: {assignment.expires_at ?? "Pending"}</p>
                  <div className="mt-4 grid gap-2">
                    {(jobsByAssignment.get(assignment.id) ?? []).map((job) => (
                      <div className="rounded-md border bg-background p-3" key={job.id}>
                        <p className="font-medium capitalize">{job.job_type.replaceAll("_", " ")}</p>
                        <p className="mt-1 text-muted-foreground capitalize">{job.status.replaceAll("_", " ")}</p>
                      </div>
                    ))}
                    {(jobsByAssignment.get(assignment.id) ?? []).length === 0 ? (
                      <p className="text-muted-foreground">Provisioning has not started yet.</p>
                    ) : null}
                  </div>
                </div>
                <p className="font-medium capitalize">{formatLabValue(assignment.status)}</p>
              </article>
            );
          })}
          {assignments?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No current lab assignment.</p> : null}
        </div>
      </section>
    </main>
  );
}
