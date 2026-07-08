import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { formatLabValue, getQueuePosition } from "@/lib/labs/queue";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type LabQueuePageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function LabQueuePage({ searchParams }: LabQueuePageProps) {
  const user = await requireAuthenticatedUser();
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("lab_queue_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const trackIds = [...new Set((entries ?? []).map((entry) => entry.lab_track_id))];
  const admin = createAdminClient();
  const [{ data: tracks }, { data: allTrackEntries }] = await Promise.all([
    trackIds.length ? supabase.from("lab_tracks").select("*").in("id", trackIds) : { data: [] },
    trackIds.length ? admin.from("lab_queue_entries").select("*").in("lab_track_id", trackIds) : { data: [] },
  ]);
  const trackMap = new Map((tracks ?? []).map((track) => [track.id, track]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Lab queue</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Your queue position is calculated from currently eligible active entries.
        </p>
      </section>
      {params.message ? (
        <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{params.message}</p>
      ) : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(entries ?? []).map((entry) => {
            const position = getQueuePosition(allTrackEntries ?? [], entry.id);
            const track = trackMap.get(entry.lab_track_id);

            return (
              <article className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_auto]" key={entry.id}>
                <div>
                  <h2 className="font-medium">{track?.name ?? "Lab track"}</h2>
                  <p className="mt-1 text-muted-foreground capitalize">{formatLabValue(entry.queue_status)}</p>
                </div>
                <div className="text-left md:text-right">
                  <p className="font-medium">{position ? `Position ${position}` : "No active position"}</p>
                  <p className="text-muted-foreground">Priority group {entry.priority_group}</p>
                </div>
              </article>
            );
          })}
          {entries?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No lab queue entries yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
