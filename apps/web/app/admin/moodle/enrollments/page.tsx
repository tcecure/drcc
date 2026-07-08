import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { markMoodleCourseCompleteAction } from "@/lib/moodle/actions";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function MoodleEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  const { data: enrollments } = await supabase
    .from("moodle_enrollments")
    .select("*")
    .order("created_at", { ascending: false });
  const userIds = [...new Set((enrollments ?? []).map((enrollment) => enrollment.user_id))];
  const courseIds = [...new Set((enrollments ?? []).map((enrollment) => enrollment.moodle_course_id))];
  const [{ data: profiles }, { data: courses }] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("id, email, full_name").in("id", userIds) : { data: [] },
    courseIds.length ? supabase.from("moodle_courses").select("*").in("moodle_course_id", courseIds) : { data: [] },
  ]);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const courseMap = new Map((courses ?? []).map((course) => [course.moodle_course_id, course]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Moodle enrollments</h1>
        <p className="mt-3 text-muted-foreground">Inspect enrollment state and mark mock courses complete.</p>
      </section>
      {params.error ? <Message tone="error" message={params.error} /> : null}
      {params.message ? <Message tone="success" message={params.message} /> : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(enrollments ?? []).map((enrollment) => {
            const profile = profileMap.get(enrollment.user_id);
            const course = courseMap.get(enrollment.moodle_course_id);

            return (
              <article className="grid gap-3 p-5 text-sm lg:grid-cols-[1fr_1fr_auto]" key={enrollment.id}>
                <div>
                  <h2 className="font-medium">{profile?.full_name || profile?.email || enrollment.user_id}</h2>
                  <p className="text-muted-foreground">{course?.course_name ?? enrollment.moodle_course_id}</p>
                </div>
                <div>
                  <p className="capitalize">{enrollment.enrollment_status.replaceAll("_", " ")}</p>
                  <p className="text-muted-foreground">{enrollment.progress_percentage}% complete</p>
                </div>
                <form action={markMoodleCourseCompleteAction}>
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="submit">
                    Mark complete
                  </button>
                </form>
              </article>
            );
          })}
          {enrollments?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No enrollments yet.</p> : null}
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
