import type { Metadata } from "next";
import Link from "next/link";

import {
  VisionCard,
  VisionMetricCard,
  VisionShell,
} from "@/components/vision/vision-shell";
import {
  getUserRoles,
  requireAnyRole,
  roleManagerRoles,
} from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Admin",
  description: "DigitalRCC lab companion administration dashboard.",
};

export default async function AdminV2Page() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const metrics = await getAdminMetrics();

  return (
    <VisionShell
      eyebrow="Operations command"
      roles={roles}
      title="Admin overview"
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <VisionMetricCard
          helper="Students waiting for the next available two-week cohort."
          label="Queue Status"
          value={metrics.queueStatus}
        />
        <VisionMetricCard
          helper="Proxmox live status will plug into this card in the next infrastructure sprint."
          label="Lab Status"
          tone="cyan"
          value={metrics.labStatus}
        />
        <VisionMetricCard
          helper="Students notified or inside an active access window."
          label="Active Students"
          tone="violet"
          value={String(metrics.activeStudents)}
        />
        <VisionMetricCard
          helper="Students assigned to a future cohort seat."
          label="Queued Students"
          tone="cyan"
          value={String(metrics.queuedStudents)}
        />
        <VisionMetricCard
          helper={`${metrics.windowDays}-day access window with ${metrics.reservedCapacity} reserved slots supported.`}
          label="Lab Capacity"
          value={`${metrics.activeStudents} / ${metrics.activeCapacity}`}
        />
        <VisionMetricCard
          helper="Submitted, queued, or on-hold hands-on lab requests."
          label="Lab Request"
          tone="emerald"
          value={String(metrics.pendingLabRequests)}
        />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <VisionCard eyebrow="Student operations" title="Queue and intake">
          <div className="grid gap-3 sm:grid-cols-2">
            <VisionAction
              href="/admin/students/import"
              label="Import students"
            />
            <VisionAction href="/admin/students/queue" label="Student queue" />
            <VisionAction href="/dashboard/approvals" label="Approvals" />
            <VisionAction href="/admin/email-jobs" label="Email jobs" />
          </div>
        </VisionCard>
        <VisionCard eyebrow="Lab operations" title="Environment controls">
          <div className="grid gap-3 sm:grid-cols-2">
            <VisionAction href="/admin/labs" label="Lab capacity" />
            <VisionAction href="/admin/lab-queue" label="Lab requests" />
            <VisionAction href="/admin/moodle" label="Moodle" />
            <VisionAction href="/admin/support" label="Support desk" />
          </div>
        </VisionCard>
      </section>
      <VisionCard eyebrow="Infrastructure" title="Current stack">
        <div className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <StackItem label="App" value="Next.js on Vercel" />
          <StackItem label="Auth" value="Supabase Auth" />
          <StackItem label="Database" value="Supabase Postgres" />
          <StackItem label="Scheduler" value="Vercel Cron + CRON_SECRET" />
        </div>
      </VisionCard>
    </VisionShell>
  );
}

async function getAdminMetrics() {
  const supabase = createAdminClient();
  const [
    { count: queuedStudents },
    { count: notifiedStudents },
    { count: activeStudents },
    { count: pendingLabRequests },
    { count: activeLabInstances },
    { data: capacitySettings },
  ] = await Promise.all([
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
      .from("lab_capacity_settings")
      .select("maximum_active, maximum_reserved, standard_duration_days")
      .is("lab_track_id", null)
      .maybeSingle(),
  ]);
  const totalActiveStudents = (activeStudents ?? 0) + (notifiedStudents ?? 0);
  const queueCount = queuedStudents ?? 0;

  return {
    activeCapacity: capacitySettings?.maximum_active ?? 20,
    activeStudents: totalActiveStudents,
    labStatus:
      (activeLabInstances ?? 0) > 0
        ? `${activeLabInstances} running`
        : "Proxmox pending",
    pendingLabRequests: pendingLabRequests ?? 0,
    queuedStudents: queueCount,
    queueStatus: queueCount > 0 ? `${queueCount} waiting` : "No waitlist",
    reservedCapacity: capacitySettings?.maximum_reserved ?? 20,
    windowDays: capacitySettings?.standard_duration_days ?? 14,
  };
}

function VisionAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="rounded-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-cyan-100 transition-colors hover:bg-white/10 hover:text-white"
      href={href}
    >
      {label}
    </Link>
  );
}

function StackItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
