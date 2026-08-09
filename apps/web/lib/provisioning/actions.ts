"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cancelProvisioningJob,
  createAssignmentProvisioningJobs,
  retryProvisioningJob,
} from "@/lib/provisioning/jobs";
import { approverRoles, requireAnyRole, requireAuthenticatedUser } from "@/lib/permissions/roles";

function formMessage(message: string) {
  return encodeURIComponent(message);
}

export async function createAssignmentProvisioningJobsAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const result = await createAssignmentProvisioningJobs({ assignmentId, actorId: actor.id });

  revalidatePath("/admin/provisioning");
  revalidatePath("/admin/labs/assignments");
  revalidatePath(`/admin/provisioning/${assignmentId}`);
  redirect(`/admin/provisioning?message=${formMessage(`${result.created} provisioning jobs created.`)}`);
}

export async function retryProvisioningJobAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const jobId = String(formData.get("jobId") ?? "");
  const result = await retryProvisioningJob(jobId, actor.id);

  revalidatePath("/admin/provisioning");
  revalidatePath(`/admin/provisioning/${jobId}`);
  redirect(`/admin/provisioning?${result.ok ? "message" : "error"}=${formMessage(result.message)}`);
}

export async function cancelProvisioningJobAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const jobId = String(formData.get("jobId") ?? "");
  const result = await cancelProvisioningJob(jobId, actor.id);

  revalidatePath("/admin/provisioning");
  revalidatePath(`/admin/provisioning/${jobId}`);
  redirect(`/admin/provisioning?${result.ok ? "message" : "error"}=${formMessage(result.message)}`);
}
