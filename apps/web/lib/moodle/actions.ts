"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { approverRoles, requireAnyRole, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMoodleUser, enrollUserInCourse, getMoodleIntegrationMode } from "@/lib/moodle/client";
import type { Json } from "@/types/database";

function formMessage(message: string) {
  return encodeURIComponent(message);
}

function readMoodleCourseId(payload: Json) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const value = payload.moodle_course_id;

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 1001;
    }
  }

  return 1001;
}

export async function createMoodleEnrollmentJob({
  userId,
  requestId,
}: {
  userId: string;
  requestId?: string;
}) {
  const supabase = createAdminClient();
  const { data: course } = await supabase
    .from("moodle_courses")
    .select("*")
    .eq("required_for_lab", true)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!course) {
    return null;
  }

  const { data: enrollment } = await supabase
    .from("moodle_enrollments")
    .upsert(
      {
        user_id: userId,
        moodle_course_id: course.moodle_course_id,
        enrollment_status: "pending",
        progress_percentage: 0,
      },
      { onConflict: "user_id,moodle_course_id" },
    )
    .select("id")
    .single();

  const { data: job } = await supabase
    .from("integration_jobs")
    .insert({
      integration_type: "moodle",
      job_type: "enroll_user_in_course",
      user_id: userId,
      entity_type: "access_requests",
      entity_id: requestId ?? null,
      payload: {
        moodle_course_id: course.moodle_course_id,
        enrollment_id: enrollment?.id,
        mode: getMoodleIntegrationMode(),
      },
    })
    .select("id")
    .single();

  await recordAuditEvent({
    actorId: null,
    action: "moodle_enrollment_job_created",
    entityType: "integration_jobs",
    entityId: job?.id ?? null,
    newValue: { user_id: userId, moodle_course_id: course.moodle_course_id },
  });

  return job;
}

export async function runMockMoodleJobAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const jobId = String(formData.get("jobId") ?? "");
  const supabase = createAdminClient();
  const { data: job } = await supabase
    .from("integration_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job?.user_id) {
    redirect(`/admin/moodle/jobs?error=${formMessage("Job not found.")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", job.user_id)
    .single();
  const moodleUser = await createMoodleUser(profile?.email ?? `${job.user_id}@mock.local`);
  const result = await enrollUserInCourse();
  const courseId = readMoodleCourseId(job.payload);

  await supabase
    .from("moodle_enrollments")
    .update({
      moodle_user_id: moodleUser.id,
      enrollment_status: "enrolled",
      progress_percentage: 0,
      enrolled_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    })
    .eq("user_id", job.user_id)
    .eq("moodle_course_id", courseId);
  await supabase
    .from("integration_jobs")
    .update({
      status: "completed",
      attempts: job.attempts + 1,
      external_job_id: result.externalJobId,
      started_at: job.started_at ?? new Date().toISOString(),
      completed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", job.id);

  await recordAuditEvent({
    actorId: actor.id,
    action: "moodle_mock_job_completed",
    entityType: "integration_jobs",
    entityId: job.id,
    newValue: { moodle_user_id: moodleUser.id, course_id: courseId },
  });

  revalidatePath("/admin/moodle/jobs");
  revalidatePath("/admin/moodle/enrollments");
  revalidatePath("/dashboard/training");
  redirect(`/admin/moodle/jobs?message=${formMessage("Mock Moodle job completed.")}`);
}

export async function markMoodleCourseCompleteAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const supabase = createAdminClient();
  const { data: enrollment } = await supabase
    .from("moodle_enrollments")
    .select("*")
    .eq("id", enrollmentId)
    .single();

  if (!enrollment) {
    redirect(`/admin/moodle/enrollments?error=${formMessage("Enrollment not found.")}`);
  }

  await supabase
    .from("moodle_enrollments")
    .update({
      enrollment_status: "completed",
      progress_percentage: 100,
      completed_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", enrollment.id);
  await supabase.from("notifications").insert({
    user_id: enrollment.user_id,
    notification_type: "moodle_course_completed",
    title: "Training complete",
    message: "Your required training is complete. You are eligible to request hands-on lab access.",
    action_url: "/dashboard/access/new",
  });
  await recordAuditEvent({
    actorId: actor.id,
    action: "moodle_course_completed",
    entityType: "moodle_enrollments",
    entityId: enrollment.id,
    previousValue: { enrollment_status: enrollment.enrollment_status },
    newValue: { enrollment_status: "completed", progress_percentage: 100 },
  });

  revalidatePath("/admin/moodle/enrollments");
  revalidatePath("/dashboard/training");
  redirect(`/admin/moodle/enrollments?message=${formMessage("Course marked complete.")}`);
}
