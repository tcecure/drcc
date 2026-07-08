import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { userHasCompletedRequiredTraining } from "@/lib/labs/actions";
import { formatLabValue } from "@/lib/labs/queue";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

export default async function LabsDashboardPage() {
  const user = await requireAuthenticatedUser();
  const [roles, eligible] = await Promise.all([getUserRoles(), userHasCompletedRequiredTraining(user.id)]);
  const supabase = await createClient();
  const { data: latestRequest } = await supabase
    .from("lab_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("requested_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .single();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Hands-on labs</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Request cyber range access, track your waitlist status, and review lab history.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          href="/dashboard/labs/request"
        >
          Request lab access
        </Link>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <StatusCard label="Training prerequisite" value={eligible ? "Complete" : "Required"} />
        <StatusCard label="Latest request" value={latestRequest ? formatLabValue(latestRequest.status) : "None"} />
        <StatusCard label="Current stage" value={latestRequest?.eligibility_verified ? "Eligible" : "Not queued"} />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <DashboardLink href="/dashboard/labs/request" title="Request" description="Submit a lab access request after Moodle completion." />
        <DashboardLink href="/dashboard/labs/queue" title="Queue" description="View your waitlist status and current position." />
        <DashboardLink href="/dashboard/labs/reservation" title="Reservation" description="Accept or decline offered lab reservations." />
        <DashboardLink href="/dashboard/labs/current" title="Current lab" description="Review active or reserved lab access." />
        <DashboardLink href="/dashboard/labs/history" title="History" description="Review previous lab requests and outcomes." />
      </section>
    </main>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold capitalize">{value}</p>
    </div>
  );
}

function DashboardLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link className="rounded-lg border bg-card p-5 shadow-sm hover:bg-muted/60" href={href}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}
