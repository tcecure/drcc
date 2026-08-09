"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { processEmailJob } from "@/lib/notifications/service";
import { approverRoles, requireAnyRole, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function formMessage(message: string) {
  return encodeURIComponent(message);
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const notificationId = String(formData.get("notificationId") ?? "");
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard/notifications");
  redirect("/dashboard/notifications");
}

export async function markAllNotificationsReadAction() {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/dashboard/notifications");
  redirect(`/dashboard/notifications?message=${formMessage("Notifications marked read.")}`);
}

export async function retryEmailJobAction(formData: FormData) {
  await requireAnyRole(approverRoles);
  const jobId = String(formData.get("jobId") ?? "");
  const result = await processEmailJob(jobId);

  revalidatePath("/admin/email-jobs");
  redirect(`/admin/email-jobs?${result.ok ? "message" : "error"}=${formMessage(result.message)}`);
}

export async function cancelEmailJobAction(formData: FormData) {
  await requireAnyRole(approverRoles);
  const jobId = String(formData.get("jobId") ?? "");
  const supabase = createAdminClient();

  await supabase
    .from("email_jobs")
    .update({ status: "cancelled" })
    .eq("id", jobId)
    .in("status", ["queued", "failed"]);

  revalidatePath("/admin/email-jobs");
  redirect(`/admin/email-jobs?message=${formMessage("Email job cancelled.")}`);
}
