import Link from "next/link";

import { CredentialReveal } from "@/components/molecules/credential-reveal";
import { DashboardNav } from "@/components/organisms/dashboard-nav";
import {
  canRevealLabCredential,
  formatLabDateTime,
  getLabAccessState,
} from "@/lib/labs/access";
import {
  getCurrentLabGuide,
  labFamilyGuides,
  totalLabCount,
} from "@/lib/labs/guides";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

const accessStateCopy = {
  queued: "Your cohort seat is reserved. The command center will unlock as the access date approaches.",
  upcoming: "Your access window starts soon. Credentials remain locked until the exact start timestamp.",
  active: "Your lab is active. Continue the next incomplete lab and keep Guacamole open in a separate tab.",
  expiring: "Your lab access ends within 48 hours. Finish outstanding work and review verifier reasons now.",
  completed: "This access window is complete. Your verified progress remains available below.",
  cancelled: "This cohort assignment was cancelled. Contact DigitalRCC support if this is unexpected.",
};

export default async function LabsDashboardPage() {
  const user = await requireAuthenticatedUser();
  const roles = await getUserRoles();
  const supabase = await createClient();
  const [{ data: assignment }, { data: progress }] = await Promise.all([
    supabase
      .from("student_cohort_assignments")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("lab_progress")
      .select("family, lab_id, completed, reason, verifier_job_id, verified_at")
      .eq("user_id", user.id),
  ]);

  if (!assignment) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <DashboardNav roles={roles} />
        <section className="rounded-lg border bg-card p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Student command center
          </p>
          <h1 className="mt-3 text-4xl font-semibold">No cohort assignment yet</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
            Submit a lab access request or contact an administrator. Once assigned,
            this page will show your access dates, lab identity, current guide,
            Guacamole launch, and AWX-verified progress.
          </p>
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            href="/dashboard/labs/request"
          >
            Request lab access
          </Link>
        </section>
      </main>
    );
  }

  const accessState = getLabAccessState(assignment);
  const completedLabs = (progress ?? []).filter((result) => result.completed).length;
  const currentLab = getCurrentLabGuide(progress ?? []);
  const revealEnabled = canRevealLabCredential(assignment);
  const launchEnabled = accessState === "active" || accessState === "expiring";
  const moodleUrl = process.env.MOODLE_BASE_URL ?? "/dashboard/training";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                Student command center
              </p>
              <span className="rounded-full border px-3 py-1 text-xs font-medium capitalize">
                {accessState}
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-semibold">
              Cohort {assignment.cohort_number} · {assignment.pod_name}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
              {accessStateCopy[accessState]}
            </p>
          </div>
          <div className="min-w-52 rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">Verified progress</p>
            <p className="mt-1 text-3xl font-semibold">
              {completedLabs}/{totalLabCount}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.round((completedLabs / totalLabCount) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Detail label="Access starts" value={formatLabDateTime(assignment.access_starts_at)} />
        <Detail label="Access ends" value={formatLabDateTime(assignment.access_ends_at)} />
        <Detail label="Seat and pod" value={`Seat ${assignment.seat_number} · ${assignment.pod_name}`} />
        <Detail label="Lab identity" value={assignment.lab_username} />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-primary">Next action</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {currentLab ? `${currentLab.id} · ${currentLab.title}` : "All 57 labs verified"}
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            {currentLab
              ? currentLab.objective
              : "AWX reports every CMMC Level 1 lab complete. Your final certificate can be synchronized when the certificate workflow issues it."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {launchEnabled ? (
              <Link
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                href={
                  currentLab
                    ? `/dashboard/labs/guides/${currentLab.family.toLowerCase()}/${currentLab.id.toLowerCase()}`
                    : "/dashboard/labs/guides"
                }
              >
                {currentLab ? "Open current lab guide" : "Review lab guides"}
              </Link>
            ) : (
              <span className="inline-flex h-11 items-center justify-center rounded-md bg-muted px-4 text-sm text-muted-foreground">
                Lab guides unlock when access starts
              </span>
            )}
            {launchEnabled ? (
              <a
                className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
                href="/api/lab-access/launch"
                rel="noreferrer"
                target="_blank"
              >
                Launch Guacamole
              </a>
            ) : (
              <span className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm text-muted-foreground">
                Guacamole locked until access starts
              </span>
            )}
          </div>
        </article>
        <article className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Lab credential</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Credentials are never emailed. Reveal is authorized on each request and
            unlocks only inside the active access window.
          </p>
          <CredentialReveal
            enabled={revealEnabled}
            unavailableReason={credentialUnavailableReason(assignment, accessState)}
            username={assignment.lab_username}
          />
        </article>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">CMMC Level 1 progress</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              AWX is the grading authority; the portal mirrors its latest successful verifier artifacts.
            </p>
          </div>
          {launchEnabled ? (
            <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/labs/guides">
              Open all guides
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">Guides locked</span>
          )}
        </div>
        <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-3">
          {labFamilyGuides.map((family) => {
            const familyResults = (progress ?? []).filter((result) => result.family === family.code);
            const familyCompleted = familyResults.filter((result) => result.completed).length;

            return (
              <article className="border-b p-5 md:border-r" key={family.code}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{family.code} · {family.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {familyCompleted}/{family.labs.length}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((familyCompleted / family.labs.length) * 100)}%` }}
                  />
                </div>
                {launchEnabled ? (
                  <Link
                    className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                    href={`/dashboard/labs/guides/${family.code.toLowerCase()}`}
                  >
                    View {family.code} labs
                  </Link>
                ) : (
                  <span className="mt-4 inline-flex text-sm text-muted-foreground">
                    Available at access start
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <LinkCard
          href="/dashboard/labs/guides"
          title="Start Here"
          description="Review the portal workflow and all six family guides."
          disabled={!launchEnabled}
        />
        <LinkCard
          href={moodleUrl}
          title="Moodle"
          description="Open supplemental DigitalRCC learning content."
          external={moodleUrl.startsWith("http")}
        />
        <LinkCard href="/dashboard/support" title="Get support" description="Report access, Guacamole, guide, or verification problems." />
      </section>
    </main>
  );
}

function credentialUnavailableReason(
  assignment: {
    credential_status: string;
    credential_ready_at: string | null;
  },
  accessState: keyof typeof accessStateCopy,
) {
  if (accessState !== "active" && accessState !== "expiring") {
    return "Credential reveal unlocks at the exact access start timestamp and closes when the window ends.";
  }

  if (assignment.credential_status !== "ready") {
    return "The assigned account is awaiting the controlled AD and Guacamole credential rotation workflow.";
  }

  if (!assignment.credential_ready_at) {
    return "The credential rotation has not reported a ready timestamp.";
  }

  return "Credential reveal is temporarily unavailable.";
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </article>
  );
}

function LinkCard({
  href,
  title,
  description,
  external = false,
  disabled = false,
}: {
  href: string;
  title: string;
  description: string;
  external?: boolean;
  disabled?: boolean;
}) {
  const className = "rounded-lg border bg-card p-5 shadow-sm transition hover:-translate-y-0.5";
  const content = (
    <>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </>
  );

  if (disabled) {
    return <div className={`${className} opacity-60`}>{content}</div>;
  }

  return external ? (
    <a className={className} href={href} rel="noreferrer" target="_blank">
      {content}
    </a>
  ) : (
    <Link className={className} href={href}>
      {content}
    </Link>
  );
}
