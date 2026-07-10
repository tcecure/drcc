"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { approverRoles, requireAnyRole, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  customerAccessReviewSchema,
  customerEngagementSchema,
  customerMemberSchema,
} from "@/lib/validation/forms";

function formMessage(message: string) {
  return encodeURIComponent(message);
}

export async function createCustomerEngagementAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const parsed = customerEngagementSchema.safeParse({
    engagementName: formData.get("engagementName"),
    customerDisplayName: formData.get("customerDisplayName"),
    engagementType: formData.get("engagementType"),
    status: formData.get("status"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    internalWorkspaceUrl: formData.get("internalWorkspaceUrl") || "",
    classificationNotice: formData.get("classificationNotice"),
  });

  if (!parsed.success) {
    redirect(`/admin/customer-delivery?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid engagement.")}`);
  }

  const supabase = createAdminClient();
  const { data: engagement, error } = await supabase
    .from("customer_engagements")
    .insert({
      engagement_name: parsed.data.engagementName,
      customer_display_name: parsed.data.customerDisplayName,
      engagement_type: parsed.data.engagementType,
      status: parsed.data.status,
      start_date: parsed.data.startDate || null,
      end_date: parsed.data.endDate || null,
      owner_id: actor.id,
      internal_workspace_url: parsed.data.internalWorkspaceUrl || null,
      classification_notice: parsed.data.classificationNotice,
    })
    .select("id")
    .single();

  if (error || !engagement) {
    redirect(`/admin/customer-delivery?error=${formMessage(error?.message ?? "Engagement could not be created.")}`);
  }

  await recordAuditEvent({
    actorId: actor.id,
    action: "customer_engagement_created",
    entityType: "customer_engagements",
    entityId: engagement.id,
    newValue: {
      status: parsed.data.status,
      engagement_type: parsed.data.engagementType,
    },
  });

  revalidatePath("/admin/customer-delivery");
  redirect(`/admin/customer-delivery?message=${formMessage("Customer engagement created.")}`);
}

export async function assignCustomerEngagementMemberAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const parsed = customerMemberSchema.safeParse({
    engagementId: formData.get("engagementId"),
    userId: formData.get("userId"),
    engagementRole: formData.get("engagementRole"),
    accessStartsAt: formData.get("accessStartsAt") || undefined,
    accessExpiresAt: formData.get("accessExpiresAt") || undefined,
  });

  if (!parsed.success) {
    redirect(`/admin/customer-delivery?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid member assignment.")}`);
  }

  const supabase = createAdminClient();
  await supabase.from("customer_engagement_members").upsert(
    {
      engagement_id: parsed.data.engagementId,
      user_id: parsed.data.userId,
      engagement_role: parsed.data.engagementRole,
      approved_by: actor.id,
      access_starts_at: parsed.data.accessStartsAt ? new Date(parsed.data.accessStartsAt).toISOString() : new Date().toISOString(),
      access_expires_at: parsed.data.accessExpiresAt ? new Date(parsed.data.accessExpiresAt).toISOString() : null,
      status: "active",
    },
    { onConflict: "engagement_id,user_id" },
  );

  await recordAuditEvent({
    actorId: actor.id,
    action: "customer_engagement_member_assigned",
    entityType: "customer_engagement_members",
    entityId: parsed.data.engagementId,
    newValue: {
      user_id: parsed.data.userId,
      engagement_role: parsed.data.engagementRole,
      access_expires_at: parsed.data.accessExpiresAt ?? null,
    },
  });

  revalidatePath("/admin/customer-delivery");
  revalidatePath(`/customer-delivery/engagements/${parsed.data.engagementId}`);
  redirect(`/admin/customer-delivery?message=${formMessage("Engagement member assigned.")}`);
}

export async function reviewCustomerAccessAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const parsed = customerAccessReviewSchema.safeParse({
    engagementId: formData.get("engagementId"),
    userId: formData.get("userId"),
    reviewStatus: formData.get("reviewStatus"),
    reviewNotes: formData.get("reviewNotes"),
  });

  if (!parsed.success) {
    redirect(`/admin/customer-delivery/access-reviews?error=${formMessage("Invalid access review.")}`);
  }

  const supabase = createAdminClient();
  await supabase.from("customer_access_reviews").insert({
    engagement_id: parsed.data.engagementId,
    user_id: parsed.data.userId,
    reviewer_id: actor.id,
    review_status: parsed.data.reviewStatus,
    review_notes: parsed.data.reviewNotes || null,
  });
  await supabase
    .from("customer_engagement_members")
    .update({
      last_reviewed_at: new Date().toISOString(),
      status: parsed.data.reviewStatus === "revoked" ? "revoked" : "active",
    })
    .eq("engagement_id", parsed.data.engagementId)
    .eq("user_id", parsed.data.userId);

  await recordAuditEvent({
    actorId: actor.id,
    action: "customer_access_reviewed",
    entityType: "customer_access_reviews",
    entityId: parsed.data.engagementId,
    newValue: {
      user_id: parsed.data.userId,
      review_status: parsed.data.reviewStatus,
    },
  });

  revalidatePath("/admin/customer-delivery/access-reviews");
  redirect(`/admin/customer-delivery/access-reviews?message=${formMessage("Access review recorded.")}`);
}

export async function revokeCustomerAccessAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(approverRoles);
  const engagementId = String(formData.get("engagementId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const supabase = createAdminClient();

  await supabase
    .from("customer_engagement_members")
    .update({ status: "revoked" })
    .eq("engagement_id", engagementId)
    .eq("user_id", userId);
  await supabase.from("customer_access_reviews").insert({
    engagement_id: engagementId,
    user_id: userId,
    reviewer_id: actor.id,
    review_status: "revoked",
    review_notes: "Access revoked from the admin portal.",
  });

  await recordAuditEvent({
    actorId: actor.id,
    action: "customer_access_revoked",
    entityType: "customer_engagement_members",
    entityId: engagementId,
    newValue: { user_id: userId, status: "revoked" },
  });

  revalidatePath("/admin/customer-delivery");
  redirect(`/admin/customer-delivery?message=${formMessage("Customer Delivery access revoked.")}`);
}
