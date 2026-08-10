import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { processDueCohortNotificationsAction } from "@/lib/students/cohort-actions";
import { cohortQueueConfig, getCohortQueueSummary } from "@/lib/students/cohorts";

type StudentQueuePageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function StudentQueuePage({ searchParams }: StudentQueuePageProps) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params, cohorts] = await Promise.all([
    getUserRoles(),
    searchParams,
    getCohortQueueSummary(),
  ]);
  const supabase = createAdminClient();
  const { data: assignments } = await supabase
    .from("student_cohort_assignments")
    .select("*")
    .order("cohort_number", { ascending: true })
    .order("seat_number", { ascending: true })
    .limit(240);
  const userIds = [...new Set((assignments ?? []).map((assignment) => assignment.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, email, full_name, organization").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Student cohort queue</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Admin-only schedule for 20-student, two-week lab access windows. The first cohort starts August 17, 2026, followed by one feedback week.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted" href="/admin/students/import">
            Import CSV
          </Link>
          <form action={processDueCohortNotificationsAction}>
            <button className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
              Send due alerts
            </button>
          </form>
        </div>
      </section>
      {params.error ? <Message tone="error" message={params.error} /> : null}
      {params.message ? <Message tone="success" message={params.message} /> : null}
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Seats per cohort" value={String(cohortQueueConfig.seatsPerCohort)} />
        <Metric label="Access window" value={`${cohortQueueConfig.accessWindowDays} days`} />
        <Metric label="First start" value={formatDate(cohortQueueConfig.firstAccessStartIso)} />
        <Metric label="Feedback pause" value={`${cohortQueueConfig.feedbackBreakDaysAfterFirstCohort} days`} />
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {cohorts.map((cohort) => (
          <article className="rounded-lg border bg-card p-5 shadow-sm" key={cohort.cohortNumber}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Cohort {cohort.cohortNumber}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{cohort.assigned} / {cohort.capacity} seats</p>
              </div>
              <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                {cohort.assigned >= cohort.capacity ? "Full" : "Open"}
              </span>
            </div>
            <dl className="mt-5 grid gap-3 text-sm">
              <Detail label="Access starts" value={formatDate(cohort.accessStartsAt)} />
              <Detail label="Access ends" value={formatDate(cohort.accessEndsAt)} />
              <Detail label="Student alert" value={formatDateTime(cohort.notificationSendAt)} />
            </dl>
          </article>
        ))}
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Scheduled students</h2>
        </div>
        <div className="divide-y">
          {(assignments ?? []).map((assignment) => {
            const profile = profileMap.get(assignment.user_id);

            return (
              <article className="grid gap-3 p-5 text-sm lg:grid-cols-[1.2fr_0.7fr_1fr_0.6fr]" key={assignment.id}>
                <div>
                  <p className="font-medium">{profile?.full_name || profile?.email || assignment.user_id}</p>
                  <p className="text-muted-foreground">{profile?.email}</p>
                </div>
                <div>
                  <p className="font-medium">Cohort {assignment.cohort_number}</p>
                  <p className="text-muted-foreground">Seat {assignment.seat_number}</p>
                </div>
                <div>
                  <p>{formatDate(assignment.access_starts_at)} - {formatDate(assignment.access_ends_at)}</p>
                  <p className="text-muted-foreground">Alert: {formatDateTime(assignment.notification_send_at)}</p>
                </div>
                <p className="font-medium capitalize">{assignment.status}</p>
              </article>
            );
          })}
          {assignments?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No students scheduled yet.</p> : null}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function Message({ tone, message }: { tone: "error" | "success"; message: string }) {
  const className =
    tone === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-primary/30 bg-primary/10 text-primary";

  return <p className={`rounded-md border p-3 text-sm ${className}`}>{message}</p>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}
