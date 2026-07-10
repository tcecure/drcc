import "server-only";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

export type ProvisioningJob = Database["public"]["Tables"]["provisioning_jobs"]["Row"];
export type ProvisioningJobType = ProvisioningJob["job_type"];

export const provisioningJobTypes = [
  "create_student_account",
  "enable_student_account",
  "assign_student_to_pod",
  "provision_guacamole_access",
  "provision_vpn_access",
  "seed_lab",
  "verify_lab",
  "disable_student_access",
  "reset_lab",
  "release_pod",
  "reset_student_password",
] as const satisfies readonly ProvisioningJobType[];

const assignmentProvisioningSequence = [
  "create_student_account",
  "enable_student_account",
  "assign_student_to_pod",
  "provision_guacamole_access",
  "provision_vpn_access",
  "seed_lab",
  "verify_lab",
] as const satisfies readonly ProvisioningJobType[];

type CreateAssignmentJobsInput = {
  assignmentId: string;
  actorId: string;
};

export async function createAssignmentProvisioningJobs({
  assignmentId,
  actorId,
}: CreateAssignmentJobsInput) {
  const supabase = createAdminClient();
  const { data: assignment } = await supabase
    .from("lab_assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();

  if (!assignment) {
    return { created: 0 };
  }

  const { data: instance } = await supabase
    .from("lab_instances")
    .select("id, lab_track_id, pod_name, environment_identifier")
    .eq("id", assignment.lab_instance_id)
    .single();
  const { data: existingJobs } = await supabase
    .from("provisioning_jobs")
    .select("id, job_type, status")
    .eq("lab_assignment_id", assignment.id)
    .in("status", ["pending_approval", "approved", "queued", "claimed", "running", "successful"]);
  const existingTypes = new Set((existingJobs ?? []).map((job) => job.job_type));
  const jobsToCreate = assignmentProvisioningSequence.filter((jobType) => !existingTypes.has(jobType));

  if (!jobsToCreate.length) {
    return { created: 0 };
  }

  const requestPayload = {
    assignmentId: assignment.id,
    labInstanceId: assignment.lab_instance_id,
    labTrackId: instance?.lab_track_id ?? null,
    podName: instance?.pod_name ?? null,
    environmentIdentifier: instance?.environment_identifier ?? null,
  } satisfies Record<string, Json>;

  const { data: jobs } = await supabase
    .from("provisioning_jobs")
    .insert(
      jobsToCreate.map((jobType) => ({
        user_id: assignment.user_id,
        lab_assignment_id: assignment.id,
        job_type: jobType,
        status: "queued",
        requested_by: actorId,
        approved_by: actorId,
        request_payload: requestPayload,
      })),
    )
    .select("id, status");

  if ((jobs ?? []).length) {
    await supabase.from("lab_assignments").update({ status: "provisioning" }).eq("id", assignment.id);
    await supabase.from("lab_instances").update({ status: "provisioning" }).eq("id", assignment.lab_instance_id);
  }

  for (const job of jobs ?? []) {
    await recordProvisioningEvent({
      jobId: job.id,
      fromStatus: null,
      toStatus: job.status,
      message: "Provisioning job created by portal.",
      payload: { assignmentId: assignment.id },
    });
  }

  await recordAuditEvent({
    actorId,
    action: "provisioning_jobs_created",
    entityType: "lab_assignments",
    entityId: assignment.id,
    newValue: {
      job_count: jobs?.length ?? 0,
      job_types: jobsToCreate,
    },
  });

  return { created: jobs?.length ?? 0 };
}

export async function retryProvisioningJob(jobId: string, actorId: string) {
  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from("provisioning_jobs")
    .select("id, status")
    .eq("id", jobId)
    .single();

  if (!previous || !["failed", "cancelled"].includes(previous.status)) {
    return { ok: false, message: "Only failed or cancelled provisioning jobs can be retried." };
  }

  await supabase
    .from("provisioning_jobs")
    .update({
      status: "queued",
      error_message: null,
      started_at: null,
      completed_at: null,
      approved_by: actorId,
    })
    .eq("id", jobId);
  await recordProvisioningEvent({
    jobId,
    fromStatus: previous.status,
    toStatus: "queued",
    message: "Job queued for retry.",
    payload: { retriedBy: actorId },
  });

  return { ok: true, message: "Provisioning job queued for retry." };
}

export async function cancelProvisioningJob(jobId: string, actorId: string) {
  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from("provisioning_jobs")
    .select("id, status")
    .eq("id", jobId)
    .single();

  if (!previous || !["pending_approval", "approved", "queued", "claimed", "failed"].includes(previous.status)) {
    return { ok: false, message: "This provisioning job cannot be cancelled." };
  }

  await supabase
    .from("provisioning_jobs")
    .update({
      status: "cancelled",
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);
  await recordProvisioningEvent({
    jobId,
    fromStatus: previous.status,
    toStatus: "cancelled",
    message: "Job cancelled from the admin portal.",
    payload: { cancelledBy: actorId },
  });

  return { ok: true, message: "Provisioning job cancelled." };
}

export async function recordProvisioningEvent({
  jobId,
  bridgeId,
  fromStatus,
  toStatus,
  message,
  payload = {},
}: {
  jobId: string;
  bridgeId?: string | null;
  fromStatus?: string | null;
  toStatus: string;
  message?: string | null;
  payload?: Json;
}) {
  const supabase = createAdminClient();

  await supabase.from("provisioning_job_events").insert({
    provisioning_job_id: jobId,
    bridge_id: bridgeId ?? null,
    from_status: fromStatus ?? null,
    to_status: toStatus,
    message: message ?? null,
    payload,
  });
}
