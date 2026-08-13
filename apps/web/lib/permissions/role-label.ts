import type { PortalRole } from "@/lib/permissions/roles";

export function getPrimaryPortalRoleLabel(roles: readonly PortalRole[]) {
  if (roles.includes("admin")) {
    return "Administrator";
  }

  if (roles.includes("approver")) {
    return "Approver";
  }

  return "Student";
}
