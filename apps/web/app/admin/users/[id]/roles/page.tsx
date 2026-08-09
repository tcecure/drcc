import type { Metadata } from "next";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import {
  assignRoleAction,
  removeRoleAction,
  updateAccountStatusAction,
} from "@/lib/auth/actions";
import {
  getUserRoles,
  requireAnyRole,
  roleManagerRoles,
} from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Manage User Roles",
  description: "Assign and remove DigitalRCC user roles.",
};

type RolePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function UserRolesPage({
  params,
  searchParams,
}: RolePageProps) {
  await requireAnyRole(roleManagerRoles);
  const [{ id }, query, currentRoles] = await Promise.all([
    params,
    searchParams,
    getUserRoles(),
  ]);
  const supabase = createAdminClient();
  const [{ data: profile }, { data: roles }, { data: assignedRoles }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).single(),
      supabase.from("roles").select("*").order("role_name"),
      supabase
        .from("user_roles")
        .select("role_id, roles(role_name, description)")
        .eq("user_id", id),
    ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={currentRoles} />
      <section>
        <h1 className="text-4xl font-semibold">Manage user roles</h1>
        <p className="mt-4 text-muted-foreground">
          {profile?.full_name || profile?.email || id}
        </p>
      </section>
      {query.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {query.error}
        </p>
      ) : null}
      {query.message ? (
        <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {query.message}
        </p>
      ) : null}
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form action={updateAccountStatusAction} className="rounded-lg border bg-card p-6 shadow-sm">
          <input type="hidden" name="userId" value={id} />
          <h2 className="text-xl font-semibold">Account status</h2>
          <select
            className="mt-4 h-11 w-full rounded-md border bg-background px-3 text-sm"
            name="accountStatus"
            defaultValue={profile?.account_status ?? "pending"}
          >
            {["pending", "active", "suspended", "disabled"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            type="submit"
          >
            Update status
          </button>
        </form>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Assigned roles</h2>
          <div className="mt-4 grid gap-3">
            {(assignedRoles ?? []).map((assignment) => (
              <form
                action={removeRoleAction}
                className="flex items-center justify-between gap-4 rounded-md border p-3"
                key={assignment.role_id}
              >
                <input type="hidden" name="userId" value={id} />
                <input type="hidden" name="roleId" value={assignment.role_id} />
                <span className="text-sm font-medium">
                  {assignment.roles?.role_name}
                </span>
                <button className="text-sm font-medium text-destructive" type="submit">
                  Remove
                </button>
              </form>
            ))}
            {assignedRoles?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles assigned.</p>
            ) : null}
          </div>
        </div>
      </section>
      <form action={assignRoleAction} className="rounded-lg border bg-card p-6 shadow-sm">
        <input type="hidden" name="userId" value={id} />
        <h2 className="text-xl font-semibold">Assign role</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select
            className="h-11 flex-1 rounded-md border bg-background px-3 text-sm"
            name="roleId"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select a role
            </option>
            {(roles ?? []).map((role) => (
              <option key={role.id} value={role.id}>
                {role.role_name}
              </option>
            ))}
          </select>
          <button
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            type="submit"
          >
            Assign role
          </button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Admins and approvers can assign permissions. Users cannot assign roles
          to themselves.
        </p>
      </form>
    </main>
  );
}
