import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function MoodleCoursesPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const { data: courses } = await supabase
    .from("moodle_courses")
    .select("*")
    .order("course_name");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Moodle courses</h1>
        <p className="mt-3 text-muted-foreground">Course catalog records used for mock enrollments.</p>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(courses ?? []).map((course) => (
            <article className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_auto]" key={course.id}>
              <div>
                <h2 className="font-medium">{course.course_name}</h2>
                <p className="text-muted-foreground">{course.description}</p>
              </div>
              <p className="font-medium">{course.required_for_lab ? "Required for lab" : "Optional"}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
