import crypto from "node:crypto";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { notifyUser } from "@/lib/notifications/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { readServerEnv } from "@/lib/validation/env";

export const runtime = "nodejs";

type MoodleWebhookPayload = {
  user_id?: string;
  moodle_user_id?: number;
  moodle_course_id?: number;
  progress_percentage?: number;
  completed?: boolean;
};

function timingSafeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isValidSignature(body: string, secret: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const normalized = signature.replace(/^sha256=/, "");

  return timingSafeCompare(normalized, expected);
}

export async function POST(request: Request) {
  const env = readServerEnv();

  if (!env.MOODLE_WEBHOOK_SECRET) {
    return Response.json({ error: "Moodle webhook secret is not configured." }, { status: 503 });
  }

  const body = await request.text();

  if (!isValidSignature(body, env.MOODLE_WEBHOOK_SECRET, request.headers.get("x-moodle-signature"))) {
    return Response.json({ error: "Invalid Moodle webhook signature." }, { status: 401 });
  }

  const payload = JSON.parse(body) as MoodleWebhookPayload;

  if (!payload.user_id || !payload.moodle_course_id) {
    return Response.json({ error: "Missing user_id or moodle_course_id." }, { status: 400 });
  }

  const progress = payload.completed ? 100 : Math.max(0, Math.min(payload.progress_percentage ?? 0, 100));
  const now = new Date().toISOString();
  const supabase = createAdminClient();
  const { data: enrollment } = await supabase
    .from("moodle_enrollments")
    .update({
      moodle_user_id: payload.moodle_user_id ?? null,
      enrollment_status: payload.completed ? "completed" : "in_progress",
      progress_percentage: progress,
      completed_at: payload.completed ? now : null,
      last_activity_at: now,
      last_synced_at: now,
    })
    .eq("user_id", payload.user_id)
    .eq("moodle_course_id", payload.moodle_course_id)
    .select("id")
    .single();

  if (!enrollment) {
    return Response.json({ error: "Enrollment not found." }, { status: 404 });
  }

  if (payload.completed) {
    await notifyUser({
      userId: payload.user_id,
      templateName: "moodle_course_completed",
      actionUrl: "/dashboard/labs/request",
      payload: {
        moodleCourseId: payload.moodle_course_id,
        progressPercentage: progress,
      },
    });
    await notifyUser({
      userId: payload.user_id,
      templateName: "hands_on_eligibility_unlocked",
      actionUrl: "/dashboard/labs/request",
      payload: {
        moodleCourseId: payload.moodle_course_id,
      },
    });
  }

  await recordAuditEvent({
    actorId: null,
    action: "moodle_webhook_progress_synced",
    entityType: "moodle_enrollments",
    entityId: enrollment.id,
    newValue: {
      completed: payload.completed ?? false,
      moodle_course_id: payload.moodle_course_id,
      progress_percentage: progress,
    },
  });

  return Response.json({ ok: true });
}
