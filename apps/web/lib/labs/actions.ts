"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { notifyUser } from "@/lib/notifications/service";
import { approverRoles, requireAnyRole, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  labAssignmentActionSchema,
  labCapacitySettingsSchema,
  labQueuePrioritySchema,
  labQueueStatusUpdateSchema,
  labReservationOfferSchema,
  labRequestFormSchema,
} from "@/lib/validation/forms";
import type { QueueStatus } from "@/lib/labs/queue";

type LabRequestStatus =
  | "draft"
  | "submitted"
  | "ineligible"
  | "queued"
  | "on_hold"
  | "withdrawn"
  | "reserved"
  | "provisioning"
  | "active"
  | "completed"
  | "expired"
  | "revoked";

type CapacitySettings = {
  id: string;
  lab_track_id: string | null;
  maximum_active: number;
  maximum_reserved: number;
  confirmation_window_hours: number;
  inactivity_warning_hours: number;
  standard_duration_days: number;
  maximum_extension_days: number;
  automatic_expiration_enabled: boolean;
  updated_by: string | null;
  updated_at: string;
};

function formMessage(message: string) {
  return encodeURIComponent(message);
}

function queueStatusToRequestStatus(status: QueueStatus): LabRequestStatus {
  const map: Partial<Record<QueueStatus, LabRequestStatus>> = {
    waiting: "queued",
    readiness_requested: "queued",
    ready: "queued",
    reservation_offered: "reserved",
    reserved: "reserved",
    provisioning: "provisioning",
    active: "active",
    paused: "on_hold",
    removed: "revoked",
    completed: "completed",
  };

  return map[status] ?? "queued";
}

async function getCapacitySettings(labTrackId: string): Promise<CapacitySettings> {
  const supabase = createAdminClient();
  const { data: trackSettings } = await supabase
    .from("lab_capacity_settings")
    .select("*")
    .eq("lab_track_id", labTrackId)
    .single();

  if (trackSettings) {
    return trackSettings;
  }

  const { data: globalSettings } = await supabase
    .from("lab_capacity_settings")
    .select("*")
    .is("lab_track_id", null)
    .single();

  if (!globalSettings) {
    throw new Error("Lab capacity settings are not configured.");
  }

  return globalSettings;
}

async function getCapacitySnapshot(labTrackId: string) {
  const supabase = createAdminClient();
  const settings = await getCapacitySettings(labTrackId);
  const { data: instances } = await supabase
    .from("lab_instances")
    .select("id, status")
    .eq("lab_track_id", labTrackId);
  const instanceIds = (instances ?? []).map((instance) => instance.id);
  const { data: assignments } = instanceIds.length
    ? await supabase
        .from("lab_assignments")
        .select("id, status, lab_instance_id")
        .in("lab_instance_id", instanceIds)
    : { data: [] };
  const activeCount = (assignments ?? []).filter((assignment) =>
    ["provisioning", "active"].includes(assignment.status),
  ).length;
  const reservedCount = (assignments ?? []).filter((assignment) =>
    ["reservation_offered", "reserved"].includes(assignment.status),
  ).length;
  const availableCount = (instances ?? []).filter((instance) => instance.status === "available").length;

  return {
    settings,
    activeCount,
    reservedCount,
    availableCount,
  };
}

export async function userHasCompletedRequiredTraining(userId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("user_completed_required_moodle_training", {
    check_user_id: userId,
  });

  return Boolean(data);
}

export async function submitLabRequestAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = labRequestFormSchema.safeParse({
    labTrackId: formData.get("labTrackId"),
    preferredStartDate: formData.get("preferredStartDate") || undefined,
    weeklyAvailability: formData.get("weeklyAvailability"),
    experienceLevel: formData.get("experienceLevel"),
    accessibilityNeeds: formData.get("accessibilityNeeds") || undefined,
    acceptableUseAccepted: formData.get("acceptableUseAccepted"),
    connectivityConfirmed: formData.get("connectivityConfirmed"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/labs/request?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid lab request.")}`);
  }

  const eligible = await userHasCompletedRequiredTraining(user.id);

  if (!eligible) {
    redirect(`/dashboard/labs/request?error=${formMessage("Complete required Moodle training before requesting hands-on lab access.")}`);
  }

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { data: labRequest, error } = await supabase
    .from("lab_requests")
    .insert({
      user_id: user.id,
      lab_track_id: parsed.data.labTrackId,
      preferred_start_date: parsed.data.preferredStartDate || null,
      weekly_availability: parsed.data.weeklyAvailability,
      experience_level: parsed.data.experienceLevel,
      accessibility_needs: parsed.data.accessibilityNeeds || null,
      acceptable_use_accepted_at: now,
      connectivity_confirmed_at: now,
      eligibility_verified: true,
      status: "queued",
      requested_at: now,
    })
    .select("id")
    .single();

  if (error || !labRequest) {
    redirect(`/dashboard/labs/request?error=${formMessage(error?.message ?? "Lab request could not be submitted.")}`);
  }

  const admin = createAdminClient();
  const { data: queueEntry } = await admin
    .from("lab_queue_entries")
    .insert({
      lab_request_id: labRequest.id,
      user_id: user.id,
      lab_track_id: parsed.data.labTrackId,
      priority_group: 100,
      queue_status: "waiting",
      eligibility_date: now,
      request_date: now,
    })
    .select("id")
    .single();

  await recordAuditEvent({
    actorId: user.id,
    action: "lab_request_submitted",
    entityType: "lab_requests",
    entityId: labRequest.id,
    newValue: {
      lab_track_id: parsed.data.labTrackId,
      queue_entry_id: queueEntry?.id ?? null,
      status: "queued",
    },
  });
  await notifyUser({
    userId: user.id,
    templateName: "lab_request_submitted",
    actionUrl: "/dashboard/labs/queue",
    payload: {
      labRequestId: labRequest.id,
      queueEntryId: queueEntry?.id ?? null,
    },
  });

  revalidatePath("/dashboard/labs");
  revalidatePath("/dashboard/labs/queue");
  redirect(`/dashboard/labs/queue?message=${formMessage("Lab request submitted. You have been added to the waitlist.")}`);
}

export async function updateLabQueueStatusAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const parsed = labQueueStatusUpdateSchema.safeParse({
    queueEntryId: formData.get("queueEntryId"),
    queueStatus: formData.get("queueStatus"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    redirect(`/admin/lab-queue?error=${formMessage("Invalid queue update.")}`);
  }

  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from("lab_queue_entries")
    .select("*")
    .eq("id", parsed.data.queueEntryId)
    .single();

  if (!previous) {
    redirect(`/admin/lab-queue?error=${formMessage("Queue entry not found.")}`);
  }

  const now = new Date().toISOString();
  const requestStatus = queueStatusToRequestStatus(parsed.data.queueStatus);
  const updates = {
    queue_status: parsed.data.queueStatus,
    ready_confirmed_at: parsed.data.queueStatus === "ready" ? now : previous.ready_confirmed_at,
    confirmation_expires_at:
      parsed.data.queueStatus === "readiness_requested"
        ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        : previous.confirmation_expires_at,
    reserved_at: parsed.data.queueStatus === "reserved" ? now : previous.reserved_at,
    override_reason: parsed.data.reason || previous.override_reason,
  };

  await supabase.from("lab_queue_entries").update(updates).eq("id", previous.id);
  await supabase
    .from("lab_requests")
    .update({ status: requestStatus })
    .eq("id", previous.lab_request_id);

  await recordAuditEvent({
    actorId: actor.id,
    action: "lab_queue_status_changed",
    entityType: "lab_queue_entries",
    entityId: previous.id,
    previousValue: { queue_status: previous.queue_status },
    newValue: { queue_status: parsed.data.queueStatus, reason: parsed.data.reason ?? null },
  });

  revalidatePath("/admin/lab-queue");
  revalidatePath(`/admin/lab-queue/${previous.id}`);
  redirect(`/admin/lab-queue?message=${formMessage("Queue status updated.")}`);
}

export async function updateLabQueuePriorityAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const parsed = labQueuePrioritySchema.safeParse({
    queueEntryId: formData.get("queueEntryId"),
    priorityGroup: formData.get("priorityGroup"),
    manualPriority: formData.get("manualPriority"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    redirect(`/admin/lab-queue?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid priority update.")}`);
  }

  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from("lab_queue_entries")
    .select("*")
    .eq("id", parsed.data.queueEntryId)
    .single();

  if (!previous) {
    redirect(`/admin/lab-queue?error=${formMessage("Queue entry not found.")}`);
  }

  await supabase
    .from("lab_queue_entries")
    .update({
      priority_group: parsed.data.priorityGroup,
      manual_priority: parsed.data.manualPriority,
      override_reason: parsed.data.reason,
    })
    .eq("id", previous.id);

  await recordAuditEvent({
    actorId: actor.id,
    action: "lab_queue_priority_changed",
    entityType: "lab_queue_entries",
    entityId: previous.id,
    previousValue: {
      priority_group: previous.priority_group,
      manual_priority: previous.manual_priority,
      override_reason: previous.override_reason,
    },
    newValue: {
      priority_group: parsed.data.priorityGroup,
      manual_priority: parsed.data.manualPriority,
      override_reason: parsed.data.reason,
    },
  });

  revalidatePath("/admin/lab-queue");
  revalidatePath(`/admin/lab-queue/${previous.id}`);
  redirect(`/admin/lab-queue?message=${formMessage("Queue priority updated.")}`);
}

export async function offerLabReservationAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const parsed = labReservationOfferSchema.safeParse({
    queueEntryId: formData.get("queueEntryId"),
  });

  if (!parsed.success) {
    redirect(`/admin/lab-queue?error=${formMessage("Invalid reservation offer.")}`);
  }

  const supabase = createAdminClient();
  const { data: entry } = await supabase
    .from("lab_queue_entries")
    .select("*")
    .eq("id", parsed.data.queueEntryId)
    .single();

  if (!entry || !["waiting", "readiness_requested", "ready"].includes(entry.queue_status)) {
    redirect(`/admin/lab-queue?error=${formMessage("Only waiting or ready students can receive a reservation offer.")}`);
  }

  const { data: existingAssignment } = await supabase
    .from("lab_assignments")
    .select("id")
    .eq("queue_entry_id", entry.id)
    .maybeSingle();

  if (existingAssignment) {
    redirect(`/admin/lab-queue?error=${formMessage("This queue entry already has an assignment.")}`);
  }

  const capacity = await getCapacitySnapshot(entry.lab_track_id);

  if (capacity.activeCount >= capacity.settings.maximum_active) {
    redirect(`/admin/lab-queue?error=${formMessage("Active lab capacity is full.")}`);
  }

  if (capacity.reservedCount >= capacity.settings.maximum_reserved) {
    redirect(`/admin/lab-queue?error=${formMessage("Reserved slot capacity is full.")}`);
  }

  if (capacity.availableCount < 1) {
    redirect(`/admin/lab-queue?error=${formMessage("No available lab instances remain for this track.")}`);
  }

  const { data: instance } = await supabase
    .from("lab_instances")
    .select("*")
    .eq("lab_track_id", entry.lab_track_id)
    .eq("status", "available")
    .order("pod_name")
    .limit(1)
    .single();

  if (!instance) {
    redirect(`/admin/lab-queue?error=${formMessage("No available lab instance found.")}`);
  }

  const now = new Date().toISOString();
  const confirmationExpiresAt = new Date(Date.now() + capacity.settings.confirmation_window_hours * 60 * 60 * 1000).toISOString();
  const { data: assignment } = await supabase
    .from("lab_assignments")
    .insert({
      user_id: entry.user_id,
      lab_instance_id: instance.id,
      queue_entry_id: entry.id,
      status: "reservation_offered",
      reserved_at: now,
    })
    .select("id")
    .single();

  await supabase
    .from("lab_instances")
    .update({
      status: "reserved",
      assigned_user_id: entry.user_id,
      assigned_at: now,
    })
    .eq("id", instance.id);
  await supabase
    .from("lab_queue_entries")
    .update({
      queue_status: "reservation_offered",
      reserved_at: now,
      confirmation_expires_at: confirmationExpiresAt,
      assigned_lab_instance_id: instance.id,
    })
    .eq("id", entry.id);
  await supabase.from("lab_requests").update({ status: "reserved" }).eq("id", entry.lab_request_id);
  await notifyUser({
    userId: entry.user_id,
    templateName: "reservation_offered",
    actionUrl: "/dashboard/labs/reservation",
    payload: {
      queueEntryId: entry.id,
      labInstanceId: instance.id,
      confirmationExpiresAt,
    },
  });

  await recordAuditEvent({
    actorId: actor.id,
    action: "lab_reservation_offered",
    entityType: "lab_assignments",
    entityId: assignment?.id ?? null,
    newValue: {
      queue_entry_id: entry.id,
      lab_instance_id: instance.id,
      confirmation_expires_at: confirmationExpiresAt,
    },
  });

  revalidatePath("/admin/lab-queue");
  revalidatePath("/admin/labs");
  redirect(`/admin/lab-queue?message=${formMessage("Reservation offered.")}`);
}

export async function acceptLabReservationAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = labAssignmentActionSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/labs/reservation?error=${formMessage("Invalid reservation.")}`);
  }

  const supabase = createAdminClient();
  const { data: assignment } = await supabase
    .from("lab_assignments")
    .select("*")
    .eq("id", parsed.data.assignmentId)
    .eq("user_id", user.id)
    .single();

  if (!assignment || assignment.status !== "reservation_offered") {
    redirect(`/dashboard/labs/reservation?error=${formMessage("Reservation offer not found.")}`);
  }

  const { data: instance } = await supabase
    .from("lab_instances")
    .select("lab_track_id")
    .eq("id", assignment.lab_instance_id)
    .single();
  const settings = await getCapacitySettings(instance?.lab_track_id ?? "");
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + settings.standard_duration_days * 24 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("lab_assignments")
    .update({
      status: "reserved",
      reserved_at: now,
      starts_at: now,
      expires_at: expiresAt,
    })
    .eq("id", assignment.id);
  await supabase
    .from("lab_instances")
    .update({
      status: "reserved",
      assigned_user_id: user.id,
      assigned_at: now,
      expires_at: expiresAt,
    })
    .eq("id", assignment.lab_instance_id);
  await supabase
    .from("lab_queue_entries")
    .update({ queue_status: "reserved", reserved_at: now })
    .eq("id", assignment.queue_entry_id);

  await recordAuditEvent({
    actorId: user.id,
    action: "lab_reservation_accepted",
    entityType: "lab_assignments",
    entityId: assignment.id,
    previousValue: { status: assignment.status },
    newValue: { status: "reserved", expires_at: expiresAt, provisioning_placeholder: true },
  });
  await notifyUser({
    userId: user.id,
    templateName: "lab_access_provisioned",
    actionUrl: "/dashboard/labs/current",
    payload: {
      assignmentId: assignment.id,
      labInstanceId: assignment.lab_instance_id,
      expiresAt,
    },
  });

  revalidatePath("/dashboard/labs/reservation");
  revalidatePath("/dashboard/labs/current");
  redirect(`/dashboard/labs/current?message=${formMessage("Reservation accepted. Provisioning is pending.")}`);
}

export async function declineLabReservationAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = labAssignmentActionSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/labs/reservation?error=${formMessage("Invalid reservation.")}`);
  }

  const supabase = createAdminClient();
  const { data: assignment } = await supabase
    .from("lab_assignments")
    .select("*")
    .eq("id", parsed.data.assignmentId)
    .eq("user_id", user.id)
    .single();

  if (!assignment || !["reservation_offered", "reserved"].includes(assignment.status)) {
    redirect(`/dashboard/labs/reservation?error=${formMessage("Reservation offer not found.")}`);
  }

  await supabase
    .from("lab_assignments")
    .update({ status: "declined", revoked_at: new Date().toISOString() })
    .eq("id", assignment.id);
  await supabase
    .from("lab_instances")
    .update({
      status: "available",
      assigned_user_id: null,
      assigned_at: null,
      expires_at: null,
    })
    .eq("id", assignment.lab_instance_id);
  await supabase
    .from("lab_queue_entries")
    .update({
      queue_status: "paused",
      reserved_at: null,
      confirmation_expires_at: null,
      assigned_lab_instance_id: null,
      override_reason: "Student declined reservation.",
    })
    .eq("id", assignment.queue_entry_id);

  await recordAuditEvent({
    actorId: user.id,
    action: "lab_reservation_declined",
    entityType: "lab_assignments",
    entityId: assignment.id,
    previousValue: { status: assignment.status },
    newValue: { status: "declined" },
  });

  revalidatePath("/dashboard/labs/reservation");
  redirect(`/dashboard/labs/queue?message=${formMessage("Reservation declined. Your queue entry was paused.")}`);
}

export async function updateLabCapacitySettingsAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const parsed = labCapacitySettingsSchema.safeParse({
    capacitySettingsId: formData.get("capacitySettingsId"),
    maximumActive: formData.get("maximumActive"),
    maximumReserved: formData.get("maximumReserved"),
    confirmationWindowHours: formData.get("confirmationWindowHours"),
    inactivityWarningHours: formData.get("inactivityWarningHours"),
    standardDurationDays: formData.get("standardDurationDays"),
    maximumExtensionDays: formData.get("maximumExtensionDays"),
    automaticExpirationEnabled: formData.get("automaticExpirationEnabled") || undefined,
  });

  if (!parsed.success) {
    redirect(`/admin/labs/capacity?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid capacity settings.")}`);
  }

  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from("lab_capacity_settings")
    .select("*")
    .eq("id", parsed.data.capacitySettingsId)
    .single();

  if (!previous) {
    redirect(`/admin/labs/capacity?error=${formMessage("Capacity settings not found.")}`);
  }

  await supabase
    .from("lab_capacity_settings")
    .update({
      maximum_active: parsed.data.maximumActive,
      maximum_reserved: parsed.data.maximumReserved,
      confirmation_window_hours: parsed.data.confirmationWindowHours,
      inactivity_warning_hours: parsed.data.inactivityWarningHours,
      standard_duration_days: parsed.data.standardDurationDays,
      maximum_extension_days: parsed.data.maximumExtensionDays,
      automatic_expiration_enabled: parsed.data.automaticExpirationEnabled === "on",
      updated_by: actor.id,
    })
    .eq("id", previous.id);

  await recordAuditEvent({
    actorId: actor.id,
    action: "lab_capacity_settings_updated",
    entityType: "lab_capacity_settings",
    entityId: previous.id,
    previousValue: {
      maximum_active: previous.maximum_active,
      maximum_reserved: previous.maximum_reserved,
      confirmation_window_hours: previous.confirmation_window_hours,
      standard_duration_days: previous.standard_duration_days,
    },
    newValue: {
      maximum_active: parsed.data.maximumActive,
      maximum_reserved: parsed.data.maximumReserved,
      confirmation_window_hours: parsed.data.confirmationWindowHours,
      standard_duration_days: parsed.data.standardDurationDays,
    },
  });

  revalidatePath("/admin/labs");
  revalidatePath("/admin/labs/capacity");
  redirect(`/admin/labs/capacity?message=${formMessage("Capacity settings updated.")}`);
}
