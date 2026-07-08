import type { Metadata } from "next";
import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import {
  getUserRoles,
  requireAnyRole,
  roleManagerRoles,
} from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin",
  description: "DigitalRCC administrative portal.",
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Admin portal</h1>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
          Manage account status and role assignments. Request submissions are
          reviewed by admins and approvers from the approvals workspace.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            href="/dashboard/approvals"
          >
            Open approvals
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            href="/admin/resources"
          >
            Manage resources
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            href="/admin/moodle"
          >
            Moodle integration
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            href="/admin/lab-queue"
          >
            Lab queue
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            href="/admin/labs"
          >
            Lab capacity
          </Link>
        </div>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
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
                <p className="font-medium">{profile.full_name || profile.email}</p>
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
