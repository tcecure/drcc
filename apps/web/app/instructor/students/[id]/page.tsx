import { notFound } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function InstructorStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAnyRole(roleManagerRoles);
  const [{ id }, roles] = await Promise.all([params, getUserRoles()]);
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from("profiles").select("email, full_name, organization").eq("id", id).single();

  if (!profile) {
    notFound();
  }

  const [{ data: assignments }, { data: verifications }] = await Promise.all([
    supabase.from("lab_assignments").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    supabase.from("lab_verifications").select("*").eq("user_id", id).order("requested_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">{profile.full_name || profile.email}</h1>
        <p className="mt-3 text-muted-foreground">{profile.organization}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Panel title="Assignments" items={(assignments ?? []).map((assignment) => `${assignment.status} / ${assignment.created_at}`)} />
        <Panel title="Verifications" items={(verifications ?? []).map((verification) => `${verification.status} / ${verification.score ?? "no score"}`)} />
      </section>
    </main>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="border-b p-5">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="divide-y">
        {items.map((item) => <p className="p-5 text-sm" key={item}>{item}</p>)}
        {items.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No records yet.</p> : null}
      </div>
    </section>
  );
}
