import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminLabTracksPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const { data: tracks } = await supabase.from("lab_tracks").select("*").order("name");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Lab tracks</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Configure track capacity and standard access duration before Sprint 7 reservations.
        </p>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(tracks ?? []).map((track) => (
            <article className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_auto]" key={track.id}>
              <div>
                <h2 className="font-medium">{track.name}</h2>
                <p className="mt-1 text-muted-foreground">{track.description}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="font-medium">Capacity {track.capacity}</p>
                <p className="text-muted-foreground">{track.standard_duration_days} days</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
