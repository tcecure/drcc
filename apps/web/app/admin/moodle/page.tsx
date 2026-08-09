import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";

const moodleLinks = [
  { href: "/admin/moodle/courses", label: "Courses", description: "Manage Moodle course catalog records." },
  { href: "/admin/moodle/enrollments", label: "Enrollments", description: "Inspect and complete student enrollments in mock mode." },
  { href: "/admin/moodle/jobs", label: "Jobs", description: "Run, retry, and inspect Moodle integration jobs." },
];

export default async function MoodleAdminPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Moodle integration</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Mock-mode enrollment jobs, course completion tracking, and hands-on eligibility controls.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {moodleLinks.map((item) => (
          <Link className="rounded-lg border bg-card p-5 shadow-sm hover:bg-muted/60" href={item.href} key={item.href}>
            <h2 className="text-lg font-semibold">{item.label}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
