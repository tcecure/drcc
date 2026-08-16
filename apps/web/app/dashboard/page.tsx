import type { Metadata } from "next";
import Link from "next/link";

import {
  DashboardCard,
  MetricCard,
} from "@/components/molecules/dashboard-card";
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
  const [profile, roles] = await Promise.all([
    getCurrentProfile(),
    getUserRoles(),
  ]);
  const audience = getDashboardAudience(roles);
  const copy = dashboardCopy[audience];
  const quickLinks = [
    {
      title: "Lab Guides",
      description:
        "Open the digital guides for the current CMMC Level 1 track.",
      href: "/dashboard/labs/guides",
    },
    {
      title: "Progress",
      description:
        "Track training and lab completion milestones as they come online.",
      href: "/dashboard/labs",
    },
    {
      title: "Queue Status",
      description: "Review your cohort placement and access window details.",
      href: "/dashboard/labs/queue",
    },
    {
      title: audience === "student" ? "Support" : "Approvals",
      description:
        audience === "student"
          ? "Ask for help with portal access or lab readiness."
          : "Review pending access decisions and student requests.",
      href:
        audience === "student" ? "/dashboard/support" : "/dashboard/approvals",
    },
  ];

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
        <DashboardCard eyebrow="Account" title="Account summary">
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
              <dd className="font-medium">
                {profile?.organization || "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Roles</dt>
              <dd className="font-medium">
                {roles.length ? roles.join(", ") : "No roles assigned"}
              </dd>
            </div>
          </dl>
        </DashboardCard>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Access model"
          value={audience}
          helper="Dashboard navigation now adapts to your assigned role."
        />
        <MetricCard
          label="Lab window"
          value="14 days"
          helper="Hands-on cohorts are scheduled in two-week access windows."
        />
        <MetricCard
          label="Capacity"
          value="20"
          helper="Each cohort is capped at 20 concurrent student seats."
        />
        <MetricCard
          label="Workspace"
          value="Live"
          helper="Portal, queue, guides, and notifications are connected."
        />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item) => (
          <DashboardCard key={item.href} title={item.title}>
            <p>{item.description}</p>
            <Link
              className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
              href={item.href}
            >
              Open
            </Link>
          </DashboardCard>
        ))}
      </section>
    </main>
  );
}
