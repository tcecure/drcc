import "server-only";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { processEmailJob } from "@/lib/notifications/service";
import { renderEmailTemplate } from "@/lib/notifications/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { readServerEnv } from "@/lib/validation/env";
import type { Database, Json } from "@/types/database";

type CohortAssignmentInsert =
  Database["public"]["Tables"]["student_cohort_assignments"]["Insert"];
type CohortAssignment =
  Database["public"]["Tables"]["student_cohort_assignments"]["Row"];

export const cohortQueueConfig = {
  firstAccessStartIso: "2026-08-17T13:00:00.000Z",
  seatsPerCohort: 20,
  accessWindowDays: 14,
  feedbackBreakDaysAfterFirstCohort: 7,
  notifyHourUtc: 14,
  scheduleUntilIso: "2027-01-01T05:59:59.000Z",
};

export type CohortSlot = {
  cohortNumber: number;
  seatNumber: number;
  accessStartsAt: string;
  accessEndsAt: string;
  notificationSendAt: string;
};

export async function assignUserToNextCohort({
  userId,
  actorId,
}: {
  userId: string;
  actorId: string;
}) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("student_cohort_assignments")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return { assignment: existing, created: false };
  }

  const slot = await getNextOpenCohortSlot();
  const scheduleUntil = new Date(cohortQueueConfig.scheduleUntilIso);

  if (new Date(slot.accessStartsAt) > scheduleUntil) {
    throw new Error("The cohort calendar is full through the end of the year.");
  }

  const insert: CohortAssignmentInsert = {
    user_id: userId,
    source: "csv_import",
    cohort_number: slot.cohortNumber,
    seat_number: slot.seatNumber,
    access_starts_at: slot.accessStartsAt,
    access_ends_at: slot.accessEndsAt,
    notification_send_at: slot.notificationSendAt,
    status: "queued",
    created_by: actorId,
  };
  const { data, error } = await supabase
    .from("student_cohort_assignments")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { assignment: data, created: true };
}

export async function getCohortQueueSummary() {
  const supabase = createAdminClient();
  const { data: assignments } = await supabase
    .from("student_cohort_assignments")
    .select("*")
    .order("cohort_number", { ascending: true })
    .order("seat_number", { ascending: true });

  return summarizeAssignments(assignments ?? []);
}

export async function processDueCohortNotifications(actorId: string | null = null) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data: assignments, error } = await supabase
    .from("student_cohort_assignments")
    .select("*")
    .eq("status", "queued")
    .lte("notification_send_at", now)
    .order("notification_send_at", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  let sent = 0;

  for (const assignment of assignments ?? []) {
    const ok = await sendCohortNotification({ assignment, actorId });

    if (ok) {
      sent += 1;
    }
  }

  return { sent, checked: assignments?.length ?? 0 };
}

export function getCohortSlot(cohortNumber: number, seatNumber: number): CohortSlot {
  const accessStartsAt = addDays(
    new Date(cohortQueueConfig.firstAccessStartIso),
    cohortOffsetDays(cohortNumber),
  );
  const accessEndsAt = addDays(accessStartsAt, cohortQueueConfig.accessWindowDays);
  const notificationSendAt = new Date(accessStartsAt);

  notificationSendAt.setUTCDate(notificationSendAt.getUTCDate() - 1);
  notificationSendAt.setUTCHours(cohortQueueConfig.notifyHourUtc, 0, 0, 0);

  return {
    cohortNumber,
    seatNumber,
    accessStartsAt: accessStartsAt.toISOString(),
    accessEndsAt: accessEndsAt.toISOString(),
    notificationSendAt: notificationSendAt.toISOString(),
  };
}

async function getNextOpenCohortSlot() {
  const supabase = createAdminClient();
  const { data: assignments } = await supabase
    .from("student_cohort_assignments")
    .select("cohort_number, seat_number, status")
    .neq("status", "cancelled");
  const occupied = new Set((assignments ?? []).map((assignment) => `${assignment.cohort_number}:${assignment.seat_number}`));
  const maxCohorts = 12;

  for (let cohortNumber = 1; cohortNumber <= maxCohorts; cohortNumber += 1) {
    for (let seatNumber = 1; seatNumber <= cohortQueueConfig.seatsPerCohort; seatNumber += 1) {
      if (!occupied.has(`${cohortNumber}:${seatNumber}`)) {
        occupied.add(`${cohortNumber}:${seatNumber}`);
        return getCohortSlot(cohortNumber, seatNumber);
      }
    }
  }

  throw new Error("No cohort seats remain.");
}

function summarizeAssignments(assignments: CohortAssignment[]) {
  const byCohort = new Map<number, CohortAssignment[]>();

  for (const assignment of assignments) {
    byCohort.set(assignment.cohort_number, [
      ...(byCohort.get(assignment.cohort_number) ?? []),
      assignment,
    ]);
  }

  const summaries = [];
  const lastCohort = Math.max(6, ...Array.from(byCohort.keys()), 1);

  for (let cohortNumber = 1; cohortNumber <= lastCohort; cohortNumber += 1) {
    const cohortAssignments = byCohort.get(cohortNumber) ?? [];
    const slot = getCohortSlot(cohortNumber, 1);

    summaries.push({
      cohortNumber,
      accessStartsAt: slot.accessStartsAt,
      accessEndsAt: slot.accessEndsAt,
      notificationSendAt: slot.notificationSendAt,
      assigned: cohortAssignments.filter((assignment) => assignment.status !== "cancelled").length,
      capacity: cohortQueueConfig.seatsPerCohort,
      statuses: cohortAssignments.reduce<Record<string, number>>((counts, assignment) => {
        counts[assignment.status] = (counts[assignment.status] ?? 0) + 1;
        return counts;
      }, {}),
    });
  }

  return summaries;
}

async function sendCohortNotification({
  assignment,
  actorId,
}: {
  assignment: CohortAssignment;
  actorId: string | null;
}) {
  const env = readServerEnv();
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", assignment.user_id)
    .single();

  if (!profile?.email) {
    return false;
  }

  const actionUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/labs`;
  const rendered = renderEmailTemplate("lab_window_starting", {
    actionUrl,
    notes: `Your access window runs ${formatDate(assignment.access_starts_at)} through ${formatDate(assignment.access_ends_at)}. Cohort ${assignment.cohort_number}, seat ${assignment.seat_number}.`,
  });
  const { data: job } = await supabase
    .from("email_jobs")
    .insert({
      user_id: assignment.user_id,
      template_name: "lab_window_starting",
      recipient: profile.email,
      subject: rendered.subject,
      payload: {
        actionUrl,
        cohortNumber: assignment.cohort_number,
        seatNumber: assignment.seat_number,
        accessStartsAt: assignment.access_starts_at,
        accessEndsAt: assignment.access_ends_at,
      } satisfies Json,
      rendered_text: rendered.text,
      rendered_html: rendered.html,
      status: "queued",
    })
    .select("id")
    .single();

  if (job?.id) {
    await processEmailJob(job.id);
  }

  await supabase
    .from("student_cohort_assignments")
    .update({ status: "notified", notified_at: new Date().toISOString() })
    .eq("id", assignment.id);

  await supabase.from("notifications").insert({
    user_id: assignment.user_id,
    notification_type: "lab_window_starting",
    title: "Lab window starting",
    message: "Your two-week lab access window starts this week. Open the lab dashboard for guides, tools, and progress tracking.",
    action_url: actionUrl,
  });

  await recordAuditEvent({
    actorId,
    action: "student_cohort_notification_sent",
    entityType: "student_cohort_assignments",
    entityId: assignment.id,
    previousValue: { status: assignment.status },
    newValue: { status: "notified", email: profile.email },
  });

  return true;
}

function cohortOffsetDays(cohortNumber: number) {
  if (cohortNumber <= 1) {
    return 0;
  }

  return (
    cohortQueueConfig.accessWindowDays +
    cohortQueueConfig.feedbackBreakDaysAfterFirstCohort +
    (cohortNumber - 2) * cohortQueueConfig.accessWindowDays
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}
