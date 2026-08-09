import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { formatLabValue } from "@/lib/labs/queue";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function LabInstancesPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const { data: instances } = await supabase
    .from("lab_instances")
    .select("*")
    .order("pod_name");
  const trackIds = [...new Set((instances ?? []).map((instance) => instance.lab_track_id))];
  const { data: tracks } = trackIds.length
    ? await supabase.from("lab_tracks").select("*").in("id", trackIds)
    : { data: [] };
  const trackMap = new Map((tracks ?? []).map((track) => [track.id, track]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin/labs">Back to labs</Link>
        <h1 className="mt-4 text-4xl font-semibold">Lab instances</h1>
        <p className="mt-3 text-muted-foreground">Pods available for reservation and provisioning.</p>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(instances ?? []).map((instance) => (
            <Link
              className="grid gap-3 p-5 text-sm hover:bg-muted/60 md:grid-cols-[1fr_1fr_auto]"
              href={`/admin/labs/instances/${instance.id}`}
              key={instance.id}
            >
              <span>
                <span className="block font-medium">{instance.pod_name}</span>
                <span className="text-muted-foreground">{instance.environment_identifier}</span>
              </span>
              <span>{trackMap.get(instance.lab_track_id)?.name ?? "Lab track"}</span>
              <span className="font-medium capitalize">{formatLabValue(instance.status)}</span>
            </Link>
          ))}
          {instances?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No lab instances found.</p> : null}
        </div>
      </section>
    </main>
  );
}
