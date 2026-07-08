import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { reviewAccessRequestAction } from "@/lib/access/actions";
import { formatAccessRequestValue } from "@/lib/access/options";
import {
  getUserRoles,
  requireAnyRole,
  roleManagerRoles,
} from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type ApprovalDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function ApprovalDetailPage({
  params,
  searchParams,
}: ApprovalDetailPageProps) {
  await requireAnyRole(roleManagerRoles);
  const [{ id }, roles, query] = await Promise.all([
    params,
    getUserRoles(),
    searchParams,
  ]);
  const supabase = createAdminClient();
  const { data: request } = await supabase
    .from("access_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!request) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, organization, account_status")
    .eq("id", request.user_id)
    .single();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">{request.requested_program}</h1>
          <p className="mt-3 text-muted-foreground">
            {profile?.full_name || profile?.email || request.user_id}
          </p>
        </div>
        <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/approvals">
          Back to submissions
        </Link>
      </section>
      {query.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {query.error}
        </p>
      ) : null}
      {query.message ? (
        <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {query.message}
        </p>
      ) : null}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Request details</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="Status" value={formatAccessRequestValue(request.status)} />
            <Detail label="Type" value={formatAccessRequestValue(request.request_type)} />
            <Detail label="Experience" value={formatAccessRequestValue(request.experience_level)} />
            <Detail label="Organization" value={request.school_or_organization} />
            <Detail label="Account status" value={profile?.account_status ?? "unknown"} />
            <Detail label="Availability" value={request.availability_notes || "Not provided"} />
          </dl>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">{request.reason}</p>
          {request.decision_notes ? (
            <div className="mt-5 rounded-md border p-4">
              <h3 className="font-medium">Applicant-visible notes</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.decision_notes}</p>
            </div>
          ) : null}
        </article>
        <form action={reviewAccessRequestAction} className="rounded-lg border bg-card p-6 shadow-sm">
          <input type="hidden" name="requestId" value={request.id} />
          <h2 className="text-xl font-semibold">Review decision</h2>
          <label className="mt-5 grid gap-2 text-sm font-medium">
            Action
            <select className="h-11 rounded-md border bg-background px-3 text-sm" name="decision" required>
              <option value="assign_reviewer">Assign to me</option>
              <option value="under_review">Mark under review</option>
              <option value="more_information_required">Request more information</option>
              <option value="approved">Approve</option>
              <option value="denied">Deny</option>
            </select>
          </label>
          <label className="mt-4 grid gap-2 text-sm font-medium">
            Applicant-visible notes
            <textarea className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm" name="decisionNotes" defaultValue={request.decision_notes ?? ""} />
          </label>
          <label className="mt-4 grid gap-2 text-sm font-medium">
            Internal notes
            <textarea className="min-h-28 rounded-md border bg-background px-3 py-2 text-sm" name="internalNotes" defaultValue={request.internal_notes ?? ""} />
          </label>
          <button className="mt-5 h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
            Save decision
          </button>
        </form>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}
