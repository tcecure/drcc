import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { formatLabDateTime, getLabAccessState } from "@/lib/labs/access";
import { getLabFamilyGuide, getLabGuide } from "@/lib/labs/guides";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

export default async function LabGuidePage({
  params,
}: {
  params: Promise<{ family: string; labId: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const roles = await getUserRoles();
  const { family: familyParam, labId } = await params;
  const family = getLabFamilyGuide(familyParam);
  const lab = getLabGuide(labId);

  if (!family || !lab || lab.family !== family.code) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: assignment }, { data: progress }] = await Promise.all([
    supabase
      .from("student_cohort_assignments")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("lab_progress")
      .select("completed, reason, verified_at")
      .eq("user_id", user.id)
      .eq("family", lab.family)
      .eq("lab_id", lab.id)
      .maybeSingle(),
  ]);
  const accessState = assignment ? getLabAccessState(assignment) : "queued";
  const canLaunch = accessState === "active" || accessState === "expiring";
  const canReviewGuide =
    roles.some((role) => role === "admin" || role === "approver") || canLaunch;

  if (!canReviewGuide) {
    redirect("/dashboard/labs");
  }
  const podName = assignment?.pod_name ?? "PodNN";
  const labIndex = family.labs.findIndex((item) => item.id === lab.id);
  const nextLab = family.labs[labIndex + 1];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link
          className="text-sm font-medium text-primary hover:underline"
          href={`/dashboard/labs/guides/${family.code.toLowerCase()}`}
        >
          Back to {family.code} guide
        </Link>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="rounded-full border px-3 py-1 text-xs font-medium">{lab.id}</span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              progress?.completed
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {progress?.completed ? "Verified complete" : "Not yet verified"}
          </span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{lab.module}</p>
        <h1 className="mt-2 text-4xl font-semibold">{lab.title}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
          {lab.objective}
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Detail label="Assigned pod" value={podName} />
        <Detail label="Lab identity" value={assignment?.lab_username ?? "Pending assignment"} />
        <Detail label="AWX verifier ID" value={lab.verifierLabId} />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Lab workflow</h2>
          <ol className="mt-5 grid list-decimal gap-4 pl-5 text-sm leading-6 text-muted-foreground">
            <li>
              Open {family.workspace.replaceAll("PODNN", podName.toUpperCase())} and work only inside your assigned pod resources.
            </li>
            <li>
              Review the seeded scenario and supporting files under {family.artifactPath.replaceAll("PodNN", podName)}.
            </li>
            <li>
              Correct the real configuration or complete the required evidence so it satisfies this objective: {lab.objective}
            </li>
            <li>
              Preserve the requested filenames and fields. AWX checks both the environment and the evidence rather than awarding partial points.
            </li>
            <li>
              Return to the command center after the next verifier cycle. If incomplete, use the AWX reason as the exact remediation checklist.
            </li>
          </ol>
        </article>
        <aside className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Latest verification</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {progress?.reason ?? "This lab has not been synchronized from AWX yet."}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {progress?.verified_at
              ? `Verified ${formatLabDateTime(progress.verified_at)}`
              : "No verification timestamp"}
          </p>
          {canLaunch ? (
            <a
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              href="/api/lab-access/launch"
              rel="noreferrer"
              target="_blank"
            >
              Launch Guacamole
            </a>
          ) : (
            <p className="mt-6 rounded-md border p-3 text-sm text-muted-foreground">
              Guacamole unlocks at the exact access start timestamp.
            </p>
          )}
          {nextLab ? (
            <Link
              className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              href={`/dashboard/labs/guides/${family.code.toLowerCase()}/${nextLab.id.toLowerCase()}`}
            >
              Next: {nextLab.id}
            </Link>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 break-words font-medium">{value}</p>
    </article>
  );
}
