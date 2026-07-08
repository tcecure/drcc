import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

export default async function TrainingDashboardPage() {
  const user = await requireAuthenticatedUser();
  const [roles] = await Promise.all([getUserRoles()]);
  const supabase = await createClient();
  const { data: enrollments } = await supabase
    .from("moodle_enrollments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const courseIds = [...new Set((enrollments ?? []).map((enrollment) => enrollment.moodle_course_id))];
  const { data: courses } = courseIds.length
    ? await supabase.from("moodle_courses").select("*").in("moodle_course_id", courseIds)
    : { data: [] };
  const courseMap = new Map((courses ?? []).map((course) => [course.moodle_course_id, course]));
  const requiredComplete = (enrollments ?? []).some((enrollment) => {
    const course = courseMap.get(enrollment.moodle_course_id);
    return course?.required_for_lab && enrollment.enrollment_status === "completed";
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Training</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Track Moodle enrollment, progress, completion, and hands-on lab eligibility.
        </p>
      </section>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Hands-on lab eligibility</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {requiredComplete
            ? "Required training is complete. You are eligible to request hands-on lab access."
            : "Complete required training before requesting hands-on lab access."}
        </p>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Assigned courses</h2>
        </div>
        <div className="divide-y">
          {(enrollments ?? []).map((enrollment) => {
            const course = courseMap.get(enrollment.moodle_course_id);

            return (
              <article className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_auto]" key={enrollment.id}>
                <div>
                  <h3 className="font-medium">{course?.course_name ?? `Course ${enrollment.moodle_course_id}`}</h3>
                  <p className="mt-1 text-muted-foreground">{course?.description}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="font-medium capitalize">{enrollment.enrollment_status.replaceAll("_", " ")}</p>
                  <p className="text-muted-foreground">{enrollment.progress_percentage}% complete</p>
                </div>
              </article>
            );
          })}
          {enrollments?.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No Moodle courses assigned yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
