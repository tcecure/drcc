import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { formatLabValue } from "@/lib/labs/queue";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function LabInstanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAnyRole(roleManagerRoles);
  const [{ id }, roles] = await Promise.all([params, getUserRoles()]);
  const supabase = createAdminClient();
  const { data: instance } = await supabase.from("lab_instances").select("*").eq("id", id).single();

  if (!instance) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <DashboardNav roles={roles} />
        <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">Lab instance not found.</p>
      </main>
    );
  }

  const [{ data: track }, { data: profile }, { data: assignment }] = await Promise.all([
    supabase.from("lab_tracks").select("*").eq("id", instance.lab_track_id).single(),
    instance.assigned_user_id ? supabase.from("profiles").select("*").eq("id", instance.assigned_user_id).single() : { data: null },
    supabase.from("lab_assignments").select("*").eq("lab_instance_id", instance.id).order("created_at", { ascending: false }).limit(1).single(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin/labs/instances">Back to instances</Link>
        <h1 className="mt-4 text-4xl font-semibold">{instance.pod_name}</h1>
        <p className="mt-3 text-muted-foreground">{instance.environment_identifier}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Detail label="Status" value={formatLabValue(instance.status)} />
        <Detail label="Track" value={track?.name ?? "Lab track"} />
        <Detail label="Assigned student" value={profile?.full_name || profile?.email || "Unassigned"} />
        <Detail label="Assigned at" value={instance.assigned_at ?? "Not assigned"} />
        <Detail label="Expires at" value={instance.expires_at ?? "No expiration"} />
        <Detail label="Latest assignment" value={assignment?.status ? formatLabValue(assignment.status) : "None"} />
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium capitalize">{value}</p>
    </div>
  );
}
