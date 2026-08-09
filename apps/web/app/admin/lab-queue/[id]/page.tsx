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

export default async function AdminLabQueueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAnyRole(roleManagerRoles);
  const [{ id }, roles] = await Promise.all([params, getUserRoles()]);
  const supabase = createAdminClient();
  const { data: entry } = await supabase.from("lab_queue_entries").select("*").eq("id", id).single();

  if (!entry) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <DashboardNav roles={roles} />
        <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">Queue entry not found.</p>
      </main>
    );
  }

  const [{ data: profile }, { data: track }, { data: labRequest }, { data: allTrackEntries }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", entry.user_id).single(),
    supabase.from("lab_tracks").select("*").eq("id", entry.lab_track_id).single(),
    supabase.from("lab_requests").select("*").eq("id", entry.lab_request_id).single(),
    supabase.from("lab_queue_entries").select("*").eq("lab_track_id", entry.lab_track_id),
  ]);
  const position = getQueuePosition(allTrackEntries ?? [], entry.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin/lab-queue">
          Back to queue
        </Link>
        <h1 className="mt-4 text-4xl font-semibold">Queue entry</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Review student readiness, queue status, and priority controls.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Detail label="Student" value={profile?.full_name || profile?.email || entry.user_id} />
        <Detail label="Track" value={track?.name ?? "Lab track"} />
        <Detail label="Position" value={position ? String(position) : "No active position"} />
      </section>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Request details</h2>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <Detail label="Status" value={formatLabValue(entry.queue_status)} />
          <Detail label="Experience" value={labRequest ? formatLabValue(labRequest.experience_level) : "Unknown"} />
          <Detail label="Preferred start" value={labRequest?.preferred_start_date ?? "No preference"} />
          <Detail label="Availability" value={labRequest?.weekly_availability ?? "Not provided"} />
          <Detail label="Accessibility needs" value={labRequest?.accessibility_needs ?? "None provided"} />
          <Detail label="Override reason" value={entry.override_reason ?? "None"} />
        </dl>
      </section>
      <section className="grid gap-4 rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Admin actions</h2>
        {["waiting", "readiness_requested", "ready"].includes(entry.queue_status) ? (
          <form action={offerLabReservationAction}>
            <input type="hidden" name="queueEntryId" value={entry.id} />
            <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
              Offer reservation
            </button>
          </form>
        ) : null}
        <form action={updateLabQueueStatusAction} className="grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
          <input type="hidden" name="queueEntryId" value={entry.id} />
          <select className="h-11 rounded-md border bg-background px-3 text-sm" name="queueStatus" defaultValue={entry.queue_status}>
            {queueStatuses.map((status) => (
              <option key={status} value={status}>{formatLabValue(status)}</option>
            ))}
          </select>
          <input className="h-11 rounded-md border bg-background px-3 text-sm" name="reason" placeholder="Optional reason" />
          <button className="h-11 rounded-md border px-4 text-sm font-medium hover:bg-muted" type="submit">Update status</button>
        </form>
        <form action={updateLabQueuePriorityAction} className="grid gap-3 md:grid-cols-[0.7fr_0.7fr_1.5fr_auto]">
          <input type="hidden" name="queueEntryId" value={entry.id} />
          <input className="h-11 rounded-md border bg-background px-3 text-sm" name="priorityGroup" defaultValue={entry.priority_group} aria-label="Priority group" />
          <input className="h-11 rounded-md border bg-background px-3 text-sm" name="manualPriority" defaultValue={entry.manual_priority} aria-label="Manual priority" />
          <input className="h-11 rounded-md border bg-background px-3 text-sm" name="reason" placeholder="Required reason" required />
          <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">Update priority</button>
        </form>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
