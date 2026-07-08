"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { createMoodleEnrollmentJob } from "@/lib/moodle/actions";
import {
  approverRoles,
  requireAnyRole,
  requireAuthenticatedUser,
} from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  requestAccessSchema,
  accessRequestDecisionSchema,
  accessRequestFormSchema,
  accessRequestWithdrawSchema,
} from "@/lib/validation/forms";
import type { Database } from "@/types/database";

type AccessRequestStatus =
  Database["public"]["Tables"]["access_requests"]["Row"]["status"];

function formMessage(message: string) {
  return encodeURIComponent(message);
}

function requestRedirect(requestId?: string, message?: string) {
  const base = requestId ? `/dashboard/access/${requestId}` : "/dashboard/access";
  return message ? `${base}?message=${formMessage(message)}` : base;
}

export async function submitPreRegistrationInterestAction(formData: FormData) {
  const parsed = requestAccessSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    organization: formData.get("organization"),
    interest: formData.get("interest"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    redirect(`/request-access?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid request.")}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("pre_registration_interests")
    .insert({
      name: parsed.data.name,
      email: parsed.data.email,
      organization: parsed.data.organization,
      interest: parsed.data.interest,
      message: parsed.data.message,
    });

  if (error) {
    redirect(`/request-access?error=${formMessage(error?.message ?? "Pre-registration could not be submitted.")}`);
  }

  await recordAuditEvent({
    actorId: null,
    action: "pre_registration_submitted",
    entityType: "pre_registration_interests",
    newValue: {
      email: parsed.data.email,
      interest: parsed.data.interest,
      status: "new",
    },
  });

  redirect("/request-access/received");
}

export async function saveAccessRequestAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = accessRequestFormSchema.safeParse({
    requestId: formData.get("requestId") || undefined,
    requestType: formData.get("requestType"),
    requestedProgram: formData.get("requestedProgram"),
    reason: formData.get("reason"),
    experienceLevel: formData.get("experienceLevel"),
    schoolOrOrganization: formData.get("schoolOrOrganization"),
    availabilityNotes: formData.get("availabilityNotes"),
    intent: formData.get("intent"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/access/new?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid access request.")}`);
  }

  const status: AccessRequestStatus =
    parsed.data.intent === "submit" ? "submitted" : "draft";
  const submittedAt = parsed.data.intent === "submit" ? new Date().toISOString() : null;
  const payload = {
    request_type: parsed.data.requestType,
    requested_program: parsed.data.requestedProgram,
    reason: parsed.data.reason,
    experience_level: parsed.data.experienceLevel,
    school_or_organization: parsed.data.schoolOrOrganization,
    availability_notes: parsed.data.availabilityNotes || null,
    status,
    submitted_at: submittedAt,
  };
  const supabase = await createClient();

  if (parsed.data.requestId) {
    const { data: existing } = await supabase
      .from("access_requests")
      .select("id, status")
      .eq("id", parsed.data.requestId)
      .eq("user_id", user.id)
      .single();

    if (!existing || !["draft", "more_information_required"].includes(existing.status)) {
      redirect(`/dashboard/access/${parsed.data.requestId}?error=${formMessage("This request can no longer be edited.")}`);
    }

    const { error } = await supabase
      .from("access_requests")
      .update(payload)
      .eq("id", parsed.data.requestId)
      .eq("user_id", user.id);

    if (error) {
      redirect(`/dashboard/access/${parsed.data.requestId}?error=${formMessage(error.message)}`);
    }

    revalidatePath("/dashboard/access");
    redirect(requestRedirect(parsed.data.requestId, status === "submitted" ? "Request submitted." : "Draft saved."));
  }

  const { data, error } = await supabase
    .from("access_requests")
    .insert({
      ...payload,
      user_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/dashboard/access/new?error=${formMessage(error?.message ?? "Request could not be saved.")}`);
  }

  await recordAuditEvent({
    actorId: user.id,
    action: status === "submitted" ? "access_request_submitted" : "access_request_drafted",
    entityType: "access_requests",
    entityId: data.id,
    newValue: { status },
  });

  revalidatePath("/dashboard/access");
  redirect(requestRedirect(data.id, status === "submitted" ? "Request submitted." : "Draft saved."));
}

export async function withdrawAccessRequestAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = accessRequestWithdrawSchema.safeParse({
    requestId: formData.get("requestId"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/access?error=${formMessage("Invalid request.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("access_requests")
    .update({ status: "withdrawn" })
    .eq("id", parsed.data.requestId)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard/access/${parsed.data.requestId}?error=${formMessage(error.message)}`);
  }

  await recordAuditEvent({
    actorId: user.id,
    action: "access_request_withdrawn",
    entityType: "access_requests",
    entityId: parsed.data.requestId,
    newValue: { status: "withdrawn" },
  });

  revalidatePath("/dashboard/access");
  redirect(`/dashboard/access?message=${formMessage("Request withdrawn.")}`);
}

export async function reviewAccessRequestAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const parsed = accessRequestDecisionSchema.safeParse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    decisionNotes: formData.get("decisionNotes"),
    internalNotes: formData.get("internalNotes"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/approvals?error=${formMessage("Invalid review action.")}`);
  }

  const statusByDecision: Record<typeof parsed.data.decision, AccessRequestStatus> = {
    assign_reviewer: "under_review",
    under_review: "under_review",
    more_information_required: "more_information_required",
    approved: "approved",
    denied: "denied",
  };
  const nextStatus = statusByDecision[parsed.data.decision];
  const supabase = createAdminClient();
  const { data: previousRequest } = await supabase
    .from("access_requests")
    .select("id, user_id, status, reviewer_id, decision_notes")
    .eq("id", parsed.data.requestId)
    .single();

  if (!previousRequest) {
    redirect(`/dashboard/approvals?error=${formMessage("Request not found.")}`);
  }

  const reviewedAt = ["approved", "denied"].includes(nextStatus)
    ? new Date().toISOString()
    : null;
  const { error } = await supabase
    .from("access_requests")
    .update({
      status: nextStatus,
      reviewer_id: actor.id,
      decision_notes: parsed.data.decisionNotes || null,
      internal_notes: parsed.data.internalNotes || null,
      reviewed_at: reviewedAt,
    })
    .eq("id", parsed.data.requestId);

  if (error) {
    redirect(`/dashboard/approvals/${parsed.data.requestId}?error=${formMessage(error.message)}`);
  }

  if (nextStatus === "approved") {
    const { data: requestDetails } = await supabase
      .from("access_requests")
      .select("request_type")
      .eq("id", parsed.data.requestId)
      .single();

    if (requestDetails?.request_type === "cmmc_level_1_training") {
      await createMoodleEnrollmentJob({
        userId: previousRequest.user_id,
        requestId: parsed.data.requestId,
      });
    }
  }

  await supabase.from("notifications").insert({
    user_id: previousRequest.user_id,
    notification_type: "access_request_decision",
    title: notificationTitle(nextStatus),
    message: notificationMessage(nextStatus, parsed.data.decisionNotes),
    action_url: `/dashboard/access/${parsed.data.requestId}`,
  });

  await recordAuditEvent({
    actorId: actor.id,
    action: `access_request_${nextStatus}`,
    entityType: "access_requests",
    entityId: parsed.data.requestId,
    previousValue: {
      status: previousRequest.status,
      reviewer_id: previousRequest.reviewer_id,
      decision_notes: previousRequest.decision_notes,
    },
    newValue: {
      status: nextStatus,
      reviewer_id: actor.id,
      decision_notes: parsed.data.decisionNotes || null,
    },
  });

  revalidatePath("/dashboard/approvals");
  revalidatePath(`/dashboard/approvals/${parsed.data.requestId}`);
  revalidatePath(`/dashboard/access/${parsed.data.requestId}`);
  redirect(`/dashboard/approvals/${parsed.data.requestId}?message=${formMessage("Request updated.")}`);
}

function notificationTitle(status: AccessRequestStatus) {
  if (status === "approved") {
    return "Access request approved";
  }

  if (status === "denied") {
    return "Access request denied";
  }

  if (status === "more_information_required") {
    return "More information requested";
  }

  return "Access request under review";
}

function notificationMessage(status: AccessRequestStatus, notes?: string) {
  const suffix = notes ? ` Reviewer note: ${notes}` : "";

  if (status === "approved") {
    return `Your DigitalRCC access request has been approved.${suffix}`;
  }

  if (status === "denied") {
    return `Your DigitalRCC access request was denied.${suffix}`;
  }

  if (status === "more_information_required") {
    return `An approver needs more information before deciding.${suffix}`;
  }

  return `An approver is reviewing your DigitalRCC access request.${suffix}`;
}
