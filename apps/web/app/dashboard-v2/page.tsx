import type { Metadata } from "next";
import Link from "next/link";

import {
  VisionCard,
  VisionMetricCard,
  VisionShell,
} from "@/components/vision/vision-shell";
import {
  getCurrentProfile,
  getDashboardAudience,
  getUserRoles,
  requireAuthenticatedUser,
} from "@/lib/permissions/roles";

export const metadata: Metadata = {
  title: "Dashboard V2",
  description: "Vision UI-inspired DigitalRCC dashboard preview.",
};

export default async function DashboardV2Page() {
  await requireAuthenticatedUser();
  const [profile, roles] = await Promise.all([
    getCurrentProfile(),
    getUserRoles(),
  ]);
  const audience = getDashboardAudience(roles);

  return (
    <VisionShell
      eyebrow="Vision UI preview"
      roles={roles}
      title={`${audience[0].toUpperCase()}${audience.slice(1)} dashboard`}
    >
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <VisionCard eyebrow="Account" title="Lab companion profile">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">Name</dt>
              <dd className="mt-1 font-medium text-white">
                {profile?.full_name || "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Status</dt>
              <dd className="mt-1 font-medium capitalize text-white">
                {profile?.account_status ?? "pending"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Organization</dt>
              <dd className="mt-1 font-medium text-white">
                {profile?.organization || "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Roles</dt>
              <dd className="mt-1 font-medium text-white">
                {roles.length ? roles.join(", ") : "No roles assigned"}
              </dd>
            </div>
          </dl>
        </VisionCard>
        <VisionCard eyebrow="Access window" title="Current operating model">
          <p>
            Students receive a 14-day lab window, cohort placement, digital lab
            guides, and progress tracking through the companion portal.
          </p>
          <Link
            className="mt-5 inline-flex rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
            href="/dashboard/labs/guides"
          >
            Open lab guides
          </Link>
        </VisionCard>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <VisionMetricCard
          helper="Role-aware navigation and protected Supabase access are active."
          label="Access model"
          value={audience}
        />
        <VisionMetricCard
          helper="Hands-on cohorts are scheduled in fixed completion windows."
          label="Lab window"
          tone="cyan"
          value="14 days"
        />
        <VisionMetricCard
          helper="Concurrent hands-on users supported by the current lab design."
          label="Capacity"
          tone="violet"
          value="20"
        />
        <VisionMetricCard
          helper="The V2 shell uses the same Supabase env and auth helpers."
          label="Supabase"
          tone="emerald"
          value="Live"
        />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Lab Guides", "/dashboard/labs/guides"],
          ["Queue Status", "/dashboard/labs/queue"],
          ["Training", "/dashboard/training"],
          [
            roles.includes("admin") ? "Admin V2" : "Support",
            roles.includes("admin") ? "/admin-v2" : "/dashboard/support",
          ],
        ].map(([label, href]) => (
          <VisionCard key={href} title={label}>
            <Link
              className="font-semibold text-cyan-200 hover:text-white"
              href={href}
            >
              Open workspace
            </Link>
          </VisionCard>
        ))}
      </section>
    </VisionShell>
  );
}
