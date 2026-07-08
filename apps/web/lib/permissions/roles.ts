import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PortalRole =
  Database["public"]["Tables"]["roles"]["Row"]["role_name"];

export const portalRoles = [
  "student",
  "approver",
  "admin",
] as const satisfies readonly PortalRole[];

export const adminRoles = [
  "admin",
] as const satisfies readonly PortalRole[];

export const approverRoles = ["admin", "approver"] as const satisfies readonly PortalRole[];

export const roleManagerRoles = approverRoles;

export type CurrentUser = {
  id: string;
  email: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentProfile() {
  const user = await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getUserRoles(userId?: string): Promise<PortalRole[]> {
  const user = userId ? { id: userId } : await requireAuthenticatedUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(role_name)")
    .eq("user_id", user.id);

  if (error || !data) {
    return [];
  }

  return data
    .map((item) => item.roles?.role_name)
    .filter((role): role is PortalRole => Boolean(role));
}

export async function hasRole(role: PortalRole) {
  const roles = await getUserRoles();
  return roles.includes(role);
}

export async function hasAnyRole(requiredRoles: readonly PortalRole[]) {
  const roles = await getUserRoles();
  return requiredRoles.some((role) => roles.includes(role));
}

export async function requireRole(role: PortalRole) {
  const allowed = await hasRole(role);

  if (!allowed) {
    redirect("/unauthorized");
  }
}

export async function requireAnyRole(requiredRoles: readonly PortalRole[]) {
  const allowed = await hasAnyRole(requiredRoles);

  if (!allowed) {
    redirect("/unauthorized");
  }
}

export function getDashboardAudience(roles: readonly PortalRole[]) {
  if (roles.includes("admin")) {
    return "admin";
  }

  if (roles.includes("approver")) {
    return "approver";
  }

  return "student";
}
