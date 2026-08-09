import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function InstructorStudentsPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const { data: assignments } = await supabase
    .from("lab_assignments")
    .select("user_id, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const userIds = [...new Set((assignments ?? []).map((assignment) => assignment.user_id))];
  const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, email, full_name, organization").in("id", userIds) : { data: [] };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Students</h1>
        <p className="mt-3 text-muted-foreground">Review students with lab assignment activity.</p>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(profiles ?? []).map((profile) => (
            <Link className="grid gap-3 p-5 text-sm hover:bg-muted/60 md:grid-cols-[1fr_auto]" href={`/instructor/students/${profile.id}`} key={profile.id}>
              <span>
                <span className="block font-medium">{profile.full_name || profile.email}</span>
                <span className="text-muted-foreground">{profile.organization}</span>
              </span>
              <span className="font-medium">{profile.email}</span>
            </Link>
          ))}
          {profiles?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No lab students yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
