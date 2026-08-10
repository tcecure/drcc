"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAnyRole, requireAuthenticatedUser, roleManagerRoles } from "@/lib/permissions/roles";
import { processDueCohortNotifications } from "@/lib/students/cohorts";

function formMessage(message: string) {
  return encodeURIComponent(message);
}

export async function processDueCohortNotificationsAction() {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(roleManagerRoles);
  const result = await processDueCohortNotifications(actor.id);

  revalidatePath("/admin/students/queue");
  revalidatePath("/admin/email-jobs");
  redirect(
    `/admin/students/queue?message=${formMessage(`Checked ${result.checked} due assignments and sent ${result.sent} alerts.`)}`,
  );
}
