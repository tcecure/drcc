import type { Metadata } from "next";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import {
  getCurrentProfile,
  getDashboardAudience,
  getUserRoles,
  requireAuthenticatedUser,
} from "@/lib/permissions/roles";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Role-aware DigitalRCC dashboard.",
};

const dashboardCopy = {
  student: {
    title: "Student dashboard",
    description:
      "Lab guides and progress tracking will appear here as they are released.",
  },
  approver: {
    title: "Approver dashboard",
    description:
      "Approval queues, student access decisions, and permission assignment workflows will appear here.",
  },
  admin: {
    title: "Admin dashboard",
    description:
      "Global controls include user management, access approvals, permissions, and audit workflows.",
  },
};

export default async function DashboardPage() {
  await requireAuthenticatedUser();
  const [profile, roles] = await Promise.all([getCurrentProfile(), getUserRoles()]);
  const audience = getDashboardAudience(roles);
  const copy = dashboardCopy[audience];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h1 className="text-4xl font-semibold">{copy.title}</h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            {copy.description}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Account summary</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{profile?.full_name || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium capitalize">
                {profile?.account_status ?? "pending"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Organization</dt>
              <dd className="font-medium">{profile?.organization || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Roles</dt>
              <dd className="font-medium">
                {roles.length ? roles.join(", ") : "No roles assigned"}
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Lab Guides", "Progress", "Approvals", "Permissions"].map((item) => (
          <article key={item} className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">{item}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Role-aware layout placeholder for Sprint 2.
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
