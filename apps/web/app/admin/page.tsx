import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";

export const metadata: Metadata = {
  title: "Admin",
  description: "DigitalRCC lab companion administration.",
};

export default async function AdminPage() {
  await requireAnyRole(roleManagerRoles);
  redirect("/admin-v2");
}
