import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getLabAccessState } from "@/lib/labs/access";
import {
  labFamilyGuides,
  labGuideSafetyNotes,
  startHereSteps,
  totalLabCount,
} from "@/lib/labs/guides";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

export default async function LabGuidesPage() {
  const user = await requireAuthenticatedUser();
  const roles = await getUserRoles();
  const supabase = await createClient();
  const { data: assignment } = await supabase
    .from("student_cohort_assignments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const accessState = assignment ? getLabAccessState(assignment) : "queued";
  const canReviewGuides =
    roles.some((role) => role === "admin" || role === "approver") ||
    accessState === "active" ||
    accessState === "expiring";

  if (!canReviewGuides) {
    redirect("/dashboard/labs");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          CMMC Level 1 · {totalLabCount} labs
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Digital lab guides</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Start here, follow the families in order, and keep this portal open while
          Guacamole runs in a separate tab. Your command center identifies the exact
          lab that AWX expects next.
        </p>
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">Start Here</h2>
          <ol className="mt-5 grid list-decimal gap-3 pl-5 text-sm leading-6 text-muted-foreground">
            {startHereSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
        <aside className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Lab safety</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
            {labGuideSafetyNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </aside>
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">CMMC Level 1 families</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete AC → IA → SI → SC → MP → PE.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {labFamilyGuides.map((family, index) => (
            <article className="rounded-lg border bg-card p-5 shadow-sm" key={family.code}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-primary">
                  {String(index + 1).padStart(2, "0")} · {family.code}
                </p>
                <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                  {family.labs.length} labs
                </span>
              </div>
              <h3 className="mt-3 text-xl font-semibold">{family.name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {family.description}
              </p>
              <Link
                className="mt-5 inline-flex font-medium text-primary hover:underline"
                href={`/dashboard/labs/guides/${family.code.toLowerCase()}`}
              >
                Open {family.code} guide
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
