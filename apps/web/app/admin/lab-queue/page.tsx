import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { offerLabReservationAction, updateLabQueuePriorityAction, updateLabQueueStatusAction } from "@/lib/labs/actions";
import { formatLabValue, getQueuePosition, type QueueStatus } from "@/lib/labs/queue";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

const queueStatuses: QueueStatus[] = [
  "waiting",
  "readiness_requested",
  "ready",
  "reservation_offered",
  "reserved",
  "provisioning",
  "active",
  "paused",
  "removed",
  "completed",
];

type AdminLabQueuePageProps = {
  searchParams: Promise<{ status?: QueueStatus; track?: string; error?: string; message?: string }>;
};

export default async function AdminLabQueuePage({ searchParams }: AdminLabQueuePageProps) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  let query = supabase
    .from("lab_queue_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (params.status) {
    query = query.eq("queue_status", params.status);
  }

  if (params.track) {
    query = query.eq("lab_track_id", params.track);
  }

  const { data: entries } = await query;
  const userIds = [...new Set((entries ?? []).map((entry) => entry.user_id))];
  const trackIds = [...new Set((entries ?? []).map((entry) => entry.lab_track_id))];
  const [{ data: profiles }, { data: tracks }, { data: allTrackEntries }] = await Promise.all([
    userIds.length ? supabase.from("profiles").select("id, email, full_name, organization").in("id", userIds) : { data: [] },
    supabase.from("lab_tracks").select("*").order("name"),
    trackIds.length ? supabase.from("lab_queue_entries").select("*").in("lab_track_id", trackIds) : { data: [] },
  ]);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const trackMap = new Map((tracks ?? []).map((track) => [track.id, track]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Lab queue</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Manage eligible hands-on lab requests before reservation and provisioning.
          </p>
        </div>
        <Link className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted" href="/admin/lab-tracks">
          Lab tracks
        </Link>
      </section>
      {params.error ? <Message tone="error" message={params.error} /> : null}
      {params.message ? <Message tone="success" message={params.message} /> : null}
      <form className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_1fr_auto]">
        <select className="h-11 rounded-md border bg-background px-3 text-sm" name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          {queueStatuses.map((status) => (
            <option key={status} value={status}>{formatLabValue(status)}</option>
          ))}
        </select>
        <select className="h-11 rounded-md border bg-background px-3 text-sm" name="track" defaultValue={params.track ?? ""}>
          <option value="">All tracks</option>
          {(tracks ?? []).map((track) => (
            <option key={track.id} value={track.id}>{track.name}</option>
          ))}
        </select>
        <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
          Filter
        </button>
      </form>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(entries ?? []).map((entry) => {
            const profile = profileMap.get(entry.user_id);
            const track = trackMap.get(entry.lab_track_id);
            const position = getQueuePosition(allTrackEntries ?? [], entry.id);

            return (
              <article className="grid gap-4 p-5 text-sm lg:grid-cols-[1.1fr_0.8fr_1.1fr]" key={entry.id}>
                <Link className="hover:underline" href={`/admin/lab-queue/${entry.id}`}>
                  <span className="block font-medium">{profile?.full_name || profile?.email || entry.user_id}</span>
                  <span className="text-muted-foreground">{profile?.organization}</span>
                </Link>
                <div>
                  <p className="font-medium">{track?.name ?? "Lab track"}</p>
                  <p className="text-muted-foreground">{position ? `Position ${position}` : "No active position"}</p>
                </div>
                <div className="grid gap-3">
                  {["waiting", "readiness_requested", "ready"].includes(entry.queue_status) ? (
                    <form action={offerLabReservationAction}>
                      <input type="hidden" name="queueEntryId" value={entry.id} />
                      <button className="h-10 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">
                        Offer reservation
                      </button>
                    </form>
                  ) : null}
                  <form action={updateLabQueueStatusAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="queueEntryId" value={entry.id} />
                    <select className="h-10 rounded-md border bg-background px-3 text-sm" name="queueStatus" defaultValue={entry.queue_status}>
                      {queueStatuses.map((status) => (
                        <option key={status} value={status}>{formatLabValue(status)}</option>
                      ))}
                    </select>
                    <button className="h-10 rounded-md border px-3 text-sm font-medium hover:bg-muted" type="submit">Update</button>
                  </form>
                  <form action={updateLabQueuePriorityAction} className="grid gap-2 sm:grid-cols-[0.6fr_0.6fr_1fr_auto]">
                    <input type="hidden" name="queueEntryId" value={entry.id} />
                    <input className="h-10 rounded-md border bg-background px-3 text-sm" name="priorityGroup" defaultValue={entry.priority_group} aria-label="Priority group" />
                    <input className="h-10 rounded-md border bg-background px-3 text-sm" name="manualPriority" defaultValue={entry.manual_priority} aria-label="Manual priority" />
                    <input className="h-10 rounded-md border bg-background px-3 text-sm" name="reason" placeholder="Reason" />
                    <button className="h-10 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">Priority</button>
                  </form>
                </div>
              </article>
            );
          })}
          {entries?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No lab queue entries found.</p> : null}
        </div>
      </section>
    </main>
  );
}

function Message({ tone, message }: { tone: "error" | "success"; message: string }) {
  const className =
    tone === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-primary/30 bg-primary/10 text-primary";

  return <p className={`rounded-md border p-3 text-sm ${className}`}>{message}</p>;
}
