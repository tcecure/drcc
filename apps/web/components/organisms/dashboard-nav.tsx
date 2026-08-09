import Link from "next/link";

import { logoutAction } from "@/lib/auth/actions";
import { roleManagerRoles, type PortalRole } from "@/lib/permissions/roles";

export function DashboardNav({ roles }: { roles: PortalRole[] }) {
  const canManageRoles = roleManagerRoles.some((role) => roles.includes(role));

  return (
    <nav
      className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-sm"
      aria-label="Dashboard navigation"
    >
      <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/dashboard">
        Overview
      </Link>
      <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/profile">
        Profile
      </Link>
      <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/access">
        Access
      </Link>
      <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/resources">
        Resources
      </Link>
      <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/training">
        Training
      </Link>
      <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/labs">
        Labs
      </Link>
      <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/notifications">
        Notifications
      </Link>
      <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/support">
        Support
      </Link>
      {canManageRoles ? (
        <>
          <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/approvals">
            Approvals
          </Link>
          <Link className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted" href="/admin">
            Admin
          </Link>
        </>
      ) : null}
      <form action={logoutAction} className="ml-auto">
        <button
          className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          type="submit"
        >
          Log out
        </button>
      </form>
    </nav>
  );
}
