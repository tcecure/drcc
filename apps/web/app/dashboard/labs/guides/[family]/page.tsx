import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getLabAccessState } from "@/lib/labs/access";
import { getLabFamilyGuide } from "@/lib/labs/guides";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

export default async function LabFamilyGuidePage({
  params,
}: {
  params: Promise<{ family: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const roles = await getUserRoles();
  const { family: familyParam } = await params;
  const family = getLabFamilyGuide(familyParam);

  if (!family) {
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
      .select("lab_id, completed, reason, verified_at")
      .eq("user_id", user.id)
      .eq("family", family.code),
  ]);
  const accessState = assignment ? getLabAccessState(assignment) : "queued";
  const canReviewGuides =
    roles.some((role) => role === "admin" || role === "approver") ||
    accessState === "active" ||
    accessState === "expiring";

  if (!canReviewGuides) {
    redirect("/dashboard/labs");
  }

  const progressByLab = new Map(
    (progress ?? []).map((result) => [result.lab_id, result]),
  );
  const completedCount = family.labs.filter(
    (lab) => progressByLab.get(lab.id)?.completed,
  ).length;
  const podName = assignment?.pod_name ?? "your assigned PodNN";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link
          className="text-sm font-medium text-primary hover:underline"
          href="/dashboard/labs/guides"
        >
          Back to all guides
        </Link>
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          {family.code} · {completedCount}/{family.labs.length} verified
        </p>
        <h1 className="mt-2 text-4xl font-semibold">{family.name}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          {family.description}
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Detail label="Workspace" value={family.workspace.replaceAll("PODNN", podName.toUpperCase())} />
        <Detail label="Lab identity" value={assignment?.lab_username ?? "Assigned before access"} />
        <Detail label="Evidence path" value={family.artifactPath.replaceAll("PodNN", podName)} />
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Complete these labs in order</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            AWX controls the pass/incomplete result. The portal displays the latest synchronized reason.
          </p>
        </div>
        <div className="divide-y">
          {family.labs.map((lab) => {
            const result = progressByLab.get(lab.id);

            return (
              <article className="grid gap-4 p-5 md:grid-cols-[1fr_auto]" key={lab.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                      {lab.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        result?.completed
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {result?.completed ? "Verified" : "Incomplete"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{lab.module}</p>
                  <h3 className="mt-1 text-lg font-semibold">{lab.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {result?.reason ?? lab.objective}
                  </p>
                </div>
                <Link
                  className="inline-flex h-10 items-center justify-center self-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                  href={`/dashboard/labs/guides/${family.code.toLowerCase()}/${lab.id.toLowerCase()}`}
                >
                  Open lab guide
                </Link>
              </article>
            );
          })}
        </div>
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
