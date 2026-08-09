import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { formatLabValue } from "@/lib/labs/queue";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type InstanceStatus = "available" | "reserved" | "provisioning" | "active" | "expiring" | "resetting" | "maintenance";

const boardStatuses: InstanceStatus[] = ["available", "reserved", "provisioning", "active", "expiring", "resetting", "maintenance"];

export default async function AdminLabsPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const [{ data: instances }, { data: settings }] = await Promise.all([
    supabase.from("lab_instances").select("*"),
    supabase.from("lab_capacity_settings").select("*").is("lab_track_id", null).single(),
  ]);
  const counts = new Map<InstanceStatus, number>();

  for (const status of boardStatuses) {
    counts.set(status, (instances ?? []).filter((instance) => instance.status === status).length);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Lab capacity</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Monitor hands-on capacity, reservations, instances, and assignment lifecycle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminLink href="/admin/labs/instances" label="Instances" />
          <AdminLink href="/admin/labs/assignments" label="Assignments" />
          <AdminLink href="/admin/labs/capacity" label="Settings" />
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Maximum active" value={settings?.maximum_active ?? 20} />
        <Metric label="Maximum reserved" value={settings?.maximum_reserved ?? 3} />
        <Metric label="Active now" value={counts.get("active") ?? 0} />
        <Metric label="Available" value={counts.get("available") ?? 0} />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {boardStatuses.map((status) => (
          <Metric key={status} label={formatLabValue(status)} value={counts.get(status) ?? 0} />
        ))}
      </section>
    </main>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted" href={href}>
      {label}
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm capitalize text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
