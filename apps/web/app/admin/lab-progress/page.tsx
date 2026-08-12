import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { formatLabDateTime, getLabAccessState } from "@/lib/labs/access";
import { getCurrentLabGuide, totalLabCount } from "@/lib/labs/guides";
import {
  getUserRoles,
  requireAnyRole,
  roleManagerRoles,
} from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminLabProgressPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const [{ data: assignments }, { data: progress }, { data: syncRuns }] =
    await Promise.all([
      supabase
        .from("student_cohort_assignments")
        .select("*")
        .neq("status", "cancelled")
        .order("cohort_number", { ascending: true })
        .order("seat_number", { ascending: true }),
      supabase.from("lab_progress").select("*"),
      supabase
        .from("lab_sync_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(6),
    ]);
  const userIds = (assignments ?? []).map((assignment) => assignment.user_id);
  const [{ data: profiles }, { data: emailJobs }] = userIds.length
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", userIds),
        supabase
          .from("email_jobs")
          .select("user_id, status, created_at")
          .in("user_id", userIds)
          .eq("template_name", "lab_window_starting")
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const emailJobByUser = new Map<
    string,
    { status: string; created_at: string }
  >();

  for (const job of emailJobs ?? []) {
    if (job.user_id && !emailJobByUser.has(job.user_id)) {
      emailJobByUser.set(job.user_id, job);
    }
  }

  const activeAssignments = (assignments ?? []).filter((assignment) => {
    const state = getLabAccessState(assignment);
    return state === "active" || state === "expiring";
  });
  const readyCredentials = (assignments ?? []).filter(
    (assignment) => assignment.credential_status === "ready",
  ).length;
  const fullyComplete = (assignments ?? []).filter((assignment) => {
    const studentProgress = (progress ?? []).filter(
      (result) => result.cohort_assignment_id === assignment.id,
    );
    return studentProgress.filter((result) => result.completed).length === totalLabCount;
  }).length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin">
          Back to admin
        </Link>
        <h1 className="mt-5 text-4xl font-semibold">Lab progress command center</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          View the portal assignment, credential readiness, and AWX-synchronized results for every cohort seat. No credential secrets are exposed in this view.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Assigned students" value={assignments?.length ?? 0} />
        <Metric label="Active windows" value={activeAssignments.length} />
        <Metric label="Credentials ready" value={readyCredentials} />
        <Metric label="All 57 verified" value={fullyComplete} />
      </section>
      <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Student assignments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Cohort / seat</th>
                <th className="px-4 py-3 font-medium">Lab identity</th>
                <th className="px-4 py-3 font-medium">Access window</th>
                <th className="px-4 py-3 font-medium">Credential</th>
                <th className="px-4 py-3 font-medium">Notification</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Next lab</th>
                <th className="px-4 py-3 font-medium">Last sync</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(assignments ?? []).map((assignment) => {
                const profile = profileById.get(assignment.user_id);
                const studentProgress = (progress ?? []).filter(
                  (result) => result.cohort_assignment_id === assignment.id,
                );
                const completed = studentProgress.filter((result) => result.completed).length;
                const currentLab = getCurrentLabGuide(studentProgress);
                const currentResult = currentLab
                  ? studentProgress.find(
                      (result) =>
                        result.family === currentLab.family &&
                        result.lab_id === currentLab.id,
                    )
                  : null;
                const latestEmailJob = emailJobByUser.get(assignment.user_id);

                return (
                  <tr key={assignment.id}>
                    <td className="px-4 py-4">
                      <p className="font-medium">{profile?.full_name || profile?.email || "Unknown user"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{profile?.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p>Cohort {assignment.cohort_number}</p>
                      <p className="text-muted-foreground">Seat {assignment.seat_number}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{assignment.pod_name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{assignment.lab_username}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="capitalize">{getLabAccessState(assignment)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatLabDateTime(assignment.access_starts_at)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        through {formatLabDateTime(assignment.access_ends_at)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="capitalize">{assignment.credential_status.replaceAll("_", " ")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Version {assignment.credential_version}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="capitalize">{latestEmailJob?.status ?? "Not queued"}</p>
                      {latestEmailJob ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatLabDateTime(latestEmailJob.created_at)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{completed}/{totalLabCount}</p>
                      <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.round((completed / totalLabCount) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="max-w-sm px-4 py-4">
                      <p>
                        {currentLab
                          ? `${currentLab.id} · ${currentLab.title}`
                          : "Curriculum complete"}
                      </p>
                      {currentResult?.reason ? (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {currentResult.reason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {assignment.last_progress_synced_at
                        ? formatLabDateTime(assignment.last_progress_synced_at)
                        : "Not synchronized"}
                    </td>
                  </tr>
                );
              })}
              {assignments?.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={9}>
                    No student cohort assignments found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Recent AWX sync runs</h2>
        </div>
        <div className="divide-y">
          {(syncRuns ?? []).map((run) => (
            <article className="grid gap-3 p-5 text-sm md:grid-cols-4" key={run.id}>
              <div>
                <p className="text-muted-foreground">Family</p>
                <p className="mt-1 font-medium">{run.family ?? "Multiple"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">AWX job</p>
                <p className="mt-1 font-medium">{run.verifier_job_id ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="mt-1 font-medium capitalize">{run.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Records</p>
                <p className="mt-1 font-medium">{run.records_upserted}/{run.records_received}</p>
              </div>
            </article>
          ))}
          {syncRuns?.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No AWX sync has run yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </article>
  );
}
