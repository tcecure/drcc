"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { notifyUser } from "@/lib/notifications/service";
import { approverRoles, requireAnyRole, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { recordProvisioningEvent } from "@/lib/provisioning/jobs";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  labAssignmentActionSchema,
  labVerificationRequestSchema,
  supportRequestSchema,
  supportStatusSchema,
} from "@/lib/validation/forms";

function formMessage(message: string) {
  return encodeURIComponent(message);
}

export async function requestLabVerificationAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = labVerificationRequestSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    verificationType: formData.get("verificationType"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/labs/current?error=${formMessage("Invalid verification request.")}`);
  }

  const supabase = createAdminClient();
  const { data: assignment } = await supabase
    .from("lab_assignments")
    .select("*")
    .eq("id", parsed.data.assignmentId)
    .eq("user_id", user.id)
    .single();

  if (!assignment || !["provisioning", "active"].includes(assignment.status)) {
    redirect(`/dashboard/labs/current?error=${formMessage("You need an active or provisioning lab assignment to verify progress.")}`);
  }

  const recentThreshold = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: recentVerification } = await supabase
    .from("lab_verifications")
    .select("id")
    .eq("lab_assignment_id", assignment.id)
    .eq("user_id", user.id)
    .gte("requested_at", recentThreshold)
    .maybeSingle();

  if (recentVerification) {
    redirect(`/dashboard/labs/current?error=${formMessage("Verification requests are limited to once every 15 minutes.")}`);
  }

  const { data: verification } = await supabase
    .from("lab_verifications")
    .insert({
      lab_assignment_id: assignment.id,
      user_id: user.id,
      verification_type: parsed.data.verificationType,
      status: "queued",
      results: {
        source: "portal",
      },
    })
    .select("id")
    .single();

  const { data: job } = await supabase
    .from("provisioning_jobs")
    .insert({
      user_id: user.id,
      lab_assignment_id: assignment.id,
      job_type: "verify_lab",
      status: "queued",
      requested_by: user.id,
      approved_by: user.id,
      request_payload: {
        assignmentId: assignment.id,
        labInstanceId: assignment.lab_instance_id,
        verificationId: verification?.id ?? null,
        verificationType: parsed.data.verificationType,
      },
    })
    .select("id")
    .single();

  if (job) {
    await recordProvisioningEvent({
      jobId: job.id,
      fromStatus: null,
      toStatus: "queued",
      message: "Student requested lab verification.",
      payload: { verificationId: verification?.id ?? null },
    });
  }

  await recordAuditEvent({
    actorId: user.id,
    action: "lab_verification_requested",
    entityType: "lab_verifications",
    entityId: verification?.id ?? null,
    newValue: {
      assignment_id: assignment.id,
      verification_type: parsed.data.verificationType,
      provisioning_job_id: job?.id ?? null,
    },
  });

  revalidatePath("/dashboard/labs/current");
  redirect(`/dashboard/labs/current?message=${formMessage("Verification request queued.")}`);
}

export async function completeLabAssignmentAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = labAssignmentActionSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/labs/current?error=${formMessage("Invalid lab assignment.")}`);
  }

  const supabase = createAdminClient();
  const { data: assignment } = await supabase
    .from("lab_assignments")
    .select("*")
    .eq("id", parsed.data.assignmentId)
    .eq("user_id", user.id)
    .single();

  if (!assignment || assignment.status !== "active") {
    redirect(`/dashboard/labs/current?error=${formMessage("Only active assignments can be completed.")}`);
  }

  const { data: passedVerification } = await supabase
    .from("lab_verifications")
    .select("id")
    .eq("lab_assignment_id", assignment.id)
    .eq("user_id", user.id)
    .eq("status", "passed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!passedVerification) {
    redirect(`/dashboard/labs/current?error=${formMessage("Pass lab verification before completing this lab.")}`);
  }

  const now = new Date().toISOString();
  await supabase
    .from("lab_assignments")
    .update({
      status: "completed",
      completed_at: now,
    })
    .eq("id", assignment.id);
  await supabase
    .from("lab_queue_entries")
    .update({ queue_status: "completed" })
    .eq("id", assignment.queue_entry_id);

  const releaseJobs = ["disable_student_access", "reset_lab", "release_pod"] as const;
  const { data: jobs } = await supabase
    .from("provisioning_jobs")
    .insert(
      releaseJobs.map((jobType) => ({
        user_id: user.id,
        lab_assignment_id: assignment.id,
        job_type: jobType,
        status: "queued",
        requested_by: user.id,
        approved_by: user.id,
        request_payload: {
          assignmentId: assignment.id,
          labInstanceId: assignment.lab_instance_id,
          completedAt: now,
        },
      })),
    )
    .select("id, job_type");

  for (const job of jobs ?? []) {
    await recordProvisioningEvent({
      jobId: job.id,
      fromStatus: null,
      toStatus: "queued",
      message: "Lab completion release job created.",
      payload: { jobType: job.job_type },
    });
  }

  await notifyUser({
    userId: user.id,
    templateName: "lab_completed",
    actionUrl: "/dashboard/labs/history",
    payload: {
      assignmentId: assignment.id,
    },
  });
  await recordAuditEvent({
    actorId: user.id,
    action: "lab_assignment_completed",
    entityType: "lab_assignments",
    entityId: assignment.id,
    newValue: {
      status: "completed",
      release_jobs: [...releaseJobs],
    },
  });

  revalidatePath("/dashboard/labs/current");
  revalidatePath("/dashboard/labs/history");
  redirect(`/dashboard/labs/history?message=${formMessage("Lab marked complete. Release jobs were queued.")}`);
}

export async function createSupportRequestAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = supportRequestSchema.safeParse({
    labAssignmentId: formData.get("labAssignmentId") || undefined,
    category: formData.get("category"),
    subject: formData.get("subject"),
    description: formData.get("description"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/support/new?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid support request.")}`);
  }

  const supabase = createAdminClient();
  const { data: supportRequest, error } = await supabase
    .from("support_requests")
    .insert({
      user_id: user.id,
      lab_assignment_id: parsed.data.labAssignmentId ?? null,
      category: parsed.data.category,
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority,
    })
    .select("id")
    .single();

  if (error || !supportRequest) {
    redirect(`/dashboard/support/new?error=${formMessage(error?.message ?? "Support request could not be created.")}`);
  }

  await recordAuditEvent({
    actorId: user.id,
    action: "support_request_created",
    entityType: "support_requests",
    entityId: supportRequest.id,
    newValue: {
      category: parsed.data.category,
      priority: parsed.data.priority,
    },
  });

  revalidatePath("/dashboard/support");
  redirect(`/dashboard/support/${supportRequest.id}?message=${formMessage("Support request created.")}`);
}

export async function updateSupportRequestStatusAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const parsed = supportStatusSchema.safeParse({
    supportRequestId: formData.get("supportRequestId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(`/admin/support?error=${formMessage("Invalid support status update.")}`);
  }

  const supabase = createAdminClient();
  const resolvedAt = ["resolved", "closed"].includes(parsed.data.status) ? new Date().toISOString() : null;

  await supabase
    .from("support_requests")
    .update({
      status: parsed.data.status,
      assigned_to: actor.id,
      resolved_at: resolvedAt,
    })
    .eq("id", parsed.data.supportRequestId);

  await recordAuditEvent({
    actorId: actor.id,
    action: "support_request_status_updated",
    entityType: "support_requests",
    entityId: parsed.data.supportRequestId,
    newValue: { status: parsed.data.status },
  });

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${parsed.data.supportRequestId}`);
  redirect(`/admin/support/${parsed.data.supportRequestId}?message=${formMessage("Support status updated.")}`);
}
