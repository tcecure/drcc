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
  const [
    { data: profiles },
    { count: queuedStudents },
    { count: notifiedStudents },
    { count: activeStudents },
    { count: pendingLabRequests },
    { count: activeLabInstances },
    { count: maintenanceLabInstances },
    { data: capacitySettings },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, organization, account_status")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("student_cohort_assignments")
      .select("id", { count: "exact", head: true })
      .eq("status", "queued"),
    supabase
      .from("student_cohort_assignments")
      .select("id", { count: "exact", head: true })
      .eq("status", "notified"),
    supabase
      .from("student_cohort_assignments")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("lab_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "queued", "on_hold"]),
    supabase
      .from("lab_instances")
      .select("id", { count: "exact", head: true })
      .in("status", ["reserved", "provisioning", "active", "expiring"]),
    supabase
      .from("lab_instances")
      .select("id", { count: "exact", head: true })
      .in("status", ["maintenance", "disabled", "resetting"]),
    supabase
      .from("lab_capacity_settings")
      .select("maximum_active, maximum_reserved, standard_duration_days")
      .is("lab_track_id", null)
      .maybeSingle(),
  ]);
  const totalActiveStudents = (activeStudents ?? 0) + (notifiedStudents ?? 0);
  const labCapacity = capacitySettings?.maximum_active ?? 20;
  const queueStatus =
    (queuedStudents ?? 0) > 0 ? `${queuedStudents} waiting` : "No waitlist";
  const labStatus =
    (activeLabInstances ?? 0) > 0
      ? `${activeLabInstances} running`
      : "API pending";
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
          label="Queue Status"
          value={queueStatus}
          helper="Students waiting for the next available two-week cohort."
        />
        <MetricCard
          label="Lab Status"
          value={labStatus}
          helper={
            maintenanceLabInstances
              ? `${maintenanceLabInstances} lab environments need attention. Proxmox live status is next.`
              : "Proxmox live status will show per-lab health here."
          }
        />
        <MetricCard
          label="Active Students"
          value={String(totalActiveStudents)}
          helper="Students notified or inside an active access window."
        />
        <MetricCard
          label="Queued Students"
          value={String(queuedStudents ?? 0)}
          helper="Students assigned to a future cohort seat."
        />
        <MetricCard
          label="Lab Capacity"
          value={`${totalActiveStudents} / ${labCapacity}`}
          helper={`${capacitySettings?.standard_duration_days ?? 14}-day access window with ${capacitySettings?.maximum_reserved ?? 20} reserved slots supported.`}
        />
        <MetricCard
          label="Lab Request"
          value={String(pendingLabRequests ?? 0)}
          helper="Submitted, queued, or on-hold hands-on lab requests."
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
