import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { formatLabValue } from "@/lib/labs/queue";
import { createAssignmentProvisioningJobsAction } from "@/lib/provisioning/actions";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function LabAssignmentsPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const { data: assignments } = await supabase
    .from("lab_assignments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  const userIds = [...new Set((assignments ?? []).map((assignment) => assignment.user_id))];
  const instanceIds = [...new Set((assignments ?? []).map((assignment) => assignment.lab_instance_id))];
  const [{ data: profiles }, { data: instances }] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("id, email, full_name, organization").in("id", userIds) : { data: [] },
    instanceIds.length ? supabase.from("lab_instances").select("*").in("id", instanceIds) : { data: [] },
  ]);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const instanceMap = new Map((instances ?? []).map((instance) => [instance.id, instance]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin/labs">Back to labs</Link>
        <h1 className="mt-4 text-4xl font-semibold">Lab assignments</h1>
        <p className="mt-3 text-muted-foreground">Reservation and assignment lifecycle history.</p>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(assignments ?? []).map((assignment) => {
            const profile = profileMap.get(assignment.user_id);
            const instance = instanceMap.get(assignment.lab_instance_id);

            return (
              <article className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_1fr_auto]" key={assignment.id}>
                <div>
                  <p className="font-medium">{profile?.full_name || profile?.email || assignment.user_id}</p>
                  <p className="text-muted-foreground">{profile?.organization}</p>
                </div>
                <div>
                  <p>{instance?.pod_name ?? "Lab instance"}</p>
                  <p className="text-muted-foreground">{assignment.expires_at ?? "No expiration"}</p>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  <p className="font-medium capitalize">{formatLabValue(assignment.status)}</p>
                  {["reserved", "provisioning"].includes(assignment.status) ? (
                    <form action={createAssignmentProvisioningJobsAction}>
                      <input type="hidden" name="assignmentId" value={assignment.id} />
                      <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" type="submit">
                        Queue provisioning
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })}
          {assignments?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No assignments yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
