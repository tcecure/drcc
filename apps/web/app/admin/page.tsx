import type { Metadata } from "next";
import Link from "next/link";

import {
  DashboardCard,
  MetricCard,
} from "@/components/molecules/dashboard-card";
import { DashboardNav } from "@/components/organisms/dashboard-nav";
import {
  getUserRoles,
  requireAnyRole,
  roleManagerRoles,
} from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin",
  description: "DigitalRCC lab companion administration.",
};

export default async function AdminPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, organization, account_status")
    .order("created_at", { ascending: false })
    .limit(20);
  const adminActions = [
    { href: "/dashboard/approvals", label: "Open approvals" },
    { href: "/admin/students/import", label: "Import students" },
    { href: "/admin/students/queue", label: "Student queue" },
    { href: "/admin/email-jobs", label: "Email jobs" },
    { href: "/admin/labs", label: "Lab capacity" },
    { href: "/admin/lab-queue", label: "Lab requests" },
    { href: "/admin/moodle", label: "Moodle" },
    { href: "/admin/support", label: "Support desk" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Admin workspace</h1>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
          Manage account status and role assignments. Request submissions are
          reviewed by admins and approvers from the approvals workspace.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Recent users"
          value={String(profiles?.length ?? 0)}
          helper="Showing the latest accounts created in Supabase."
        />
        <MetricCard
          label="Student seats"
          value="20"
          helper="Hands-on capacity per two-week cohort."
        />
        <MetricCard
          label="Review roles"
          value="2"
          helper="Admins and approvers can manage student access."
        />
        <MetricCard
          label="Automation"
          value="Cron"
          helper="Queue notifications are ready for scheduled processing."
        />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminActions.map((action) => (
          <DashboardCard key={action.href} title={action.label}>
            <Link
              className="inline-flex text-sm font-semibold text-primary hover:underline"
              href={action.href}
            >
              Open workspace
            </Link>
          </DashboardCard>
        ))}
      </section>
      <section className="dashboard-card p-0">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Recent users</h2>
        </div>
        <div className="divide-y">
          {(profiles ?? []).map((profile) => (
            <div
              key={profile.id}
              className="grid gap-3 p-5 text-sm lg:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <p className="font-medium">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{profile.organization}</p>
                <p className="capitalize">{profile.account_status}</p>
              </div>
              <Link
                className="font-medium text-primary hover:underline"
                href={`/admin/users/${profile.id}/roles`}
              >
                Manage roles
              </Link>
            </div>
          ))}
          {profiles?.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No users found.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
