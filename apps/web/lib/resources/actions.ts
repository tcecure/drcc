"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { adminRoles, requireAnyRole, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { resourceEditorSchema } from "@/lib/validation/forms";
import type { Database } from "@/types/database";

type ResourceInsert = Database["public"]["Tables"]["resources"]["Insert"];
type ResourceUpdate = Database["public"]["Tables"]["resources"]["Update"];

function formMessage(message: string) {
  return encodeURIComponent(message);
}

export async function saveResourceAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(adminRoles);
  const parsed = resourceEditorSchema.safeParse({
    resourceId: formData.get("resourceId") || undefined,
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    resourceType: formData.get("resourceType"),
    programArea: formData.get("programArea"),
    audience: formData.get("audience"),
    requiredRole: formData.get("requiredRole"),
    filePath: formData.get("filePath"),
    externalUrl: formData.get("externalUrl"),
    version: formData.get("version"),
    status: formData.get("status"),
    effectiveDate: formData.get("effectiveDate"),
    expirationDate: formData.get("expirationDate"),
    reviewDueAt: formData.get("reviewDueAt"),
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    const target = formData.get("resourceId")
      ? `/admin/resources/${formData.get("resourceId")}/edit`
      : "/admin/resources/new";

    redirect(`${target}?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid resource.")}`);
  }

  const sharedPayload: ResourceUpdate = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description,
    resource_type: parsed.data.resourceType,
    program_area: parsed.data.programArea,
    audience: parsed.data.audience,
    required_role: parsed.data.requiredRole === "none" ? null : parsed.data.requiredRole,
    file_path: parsed.data.filePath || null,
    external_url: parsed.data.externalUrl || null,
    version: parsed.data.version,
    status: parsed.data.status,
    effective_date: parsed.data.effectiveDate || null,
    expiration_date: parsed.data.expirationDate || null,
    review_due_at: parsed.data.reviewDueAt || null,
    reviewed_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    owner_id: actor.id,
  };
  const createPayload: ResourceInsert = {
    ...sharedPayload,
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description,
    resource_type: parsed.data.resourceType,
    program_area: parsed.data.programArea,
  };
  const supabase = createAdminClient();

  if (parsed.data.resourceId) {
    const { data: previousResource } = await supabase
      .from("resources")
      .select("*")
      .eq("id", parsed.data.resourceId)
      .single();
    const { error } = await supabase
      .from("resources")
      .update(sharedPayload)
      .eq("id", parsed.data.resourceId);

    if (error) {
      redirect(`/admin/resources/${parsed.data.resourceId}/edit?error=${formMessage(error.message)}`);
    }

    await syncTags(parsed.data.resourceId, parsed.data.tags);
    await recordAuditEvent({
      actorId: actor.id,
      action: "resource_updated",
      entityType: "resources",
      entityId: parsed.data.resourceId,
      previousValue: previousResource,
      newValue: sharedPayload,
    });
    revalidateResourcePaths(parsed.data.slug);
    redirect(`/admin/resources/${parsed.data.resourceId}/edit?message=${formMessage("Resource updated.")}`);
  }

  const { data, error } = await supabase
    .from("resources")
    .insert(createPayload)
    .select("id, slug")
    .single();

  if (error || !data) {
    redirect(`/admin/resources/new?error=${formMessage(error?.message ?? "Resource could not be saved.")}`);
  }

  await syncTags(data.id, parsed.data.tags);
  await recordAuditEvent({
    actorId: actor.id,
    action: "resource_created",
    entityType: "resources",
    entityId: data.id,
    newValue: createPayload,
  });
  revalidateResourcePaths(data.slug);
  redirect(`/admin/resources/${data.id}/edit?message=${formMessage("Resource created.")}`);
}

async function syncTags(resourceId: string, tags?: string) {
  const supabase = createAdminClient();
  const tagNames = (tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  await supabase.from("resource_tag_links").delete().eq("resource_id", resourceId);

  if (!tagNames.length) {
    return;
  }

  for (const name of tagNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data: tag } = await supabase
      .from("resource_tags")
      .upsert({ name, slug }, { onConflict: "slug" })
      .select("id")
      .single();

    if (tag) {
      await supabase
        .from("resource_tag_links")
        .insert({ resource_id: resourceId, tag_id: tag.id });
    }
  }
}

function revalidateResourcePaths(slug: string) {
  revalidatePath("/resources");
  revalidatePath("/dashboard/resources");
  revalidatePath(`/dashboard/resources/${slug}`);
  revalidatePath("/admin/resources");
}
