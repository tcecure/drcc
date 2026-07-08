import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { formatLabValue } from "@/lib/labs/queue";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

export default async function LabHistoryPage() {
  const user = await requireAuthenticatedUser();
  const roles = await getUserRoles();
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("lab_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("requested_at", { ascending: false, nullsFirst: false });
  const trackIds = [...new Set((requests ?? []).map((request) => request.lab_track_id))];
  const { data: tracks } = trackIds.length
    ? await supabase.from("lab_tracks").select("*").in("id", trackIds)
    : { data: [] };
  const trackMap = new Map((tracks ?? []).map((track) => [track.id, track]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Lab history</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Review previous hands-on lab requests and their outcomes.
        </p>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(requests ?? []).map((request) => {
            const track = trackMap.get(request.lab_track_id);

            return (
              <article className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_auto]" key={request.id}>
                <div>
                  <h2 className="font-medium">{track?.name ?? "Lab track"}</h2>
                  <p className="mt-1 text-muted-foreground">{request.weekly_availability}</p>
                </div>
                <p className="font-medium capitalize">{formatLabValue(request.status)}</p>
              </article>
            );
          })}
          {requests?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No lab history yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
