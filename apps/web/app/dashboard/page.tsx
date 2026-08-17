import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getUserRoles,
  requireAuthenticatedUser,
  roleManagerRoles,
} from "@/lib/permissions/roles";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Role-aware DigitalRCC dashboard.",
};

export default async function DashboardPage() {
  await requireAuthenticatedUser();
  const roles = await getUserRoles();
  const canManage = roleManagerRoles.some((role) => roles.includes(role));

  redirect(canManage ? "/admin-v2" : "/dashboard-v2");
}
