import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { AccessRequestForm } from "@/components/templates/access-request-form";
import {
  saveAccessRequestAction,
  withdrawAccessRequestAction,
} from "@/lib/access/actions";
import { formatAccessRequestValue } from "@/lib/access/options";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

type AccessRequestDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AccessRequestDetailPage({
  params,
  searchParams,
}: AccessRequestDetailPageProps) {
  const user = await requireAuthenticatedUser();
  const [{ id }, roles, query] = await Promise.all([
    params,
    getUserRoles(),
    searchParams,
  ]);
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("access_requests")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!request) {
    notFound();
  }

  const canEdit = ["draft", "more_information_required"].includes(request.status);
  const canWithdraw = ["draft", "submitted", "under_review", "more_information_required"].includes(request.status);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">{request.requested_program}</h1>
          <p className="mt-3 text-muted-foreground">
            Status: <span className="font-medium capitalize text-foreground">{formatAccessRequestValue(request.status)}</span>
          </p>
        </div>
        <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/access">
          Back to requests
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
      {request.decision_notes ? (
        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Approver response</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{request.decision_notes}</p>
        </section>
      ) : null}
      {canEdit ? (
        <AccessRequestForm action={saveAccessRequestAction} request={request} />
      ) : (
        <section className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Request details</h2>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="Type" value={formatAccessRequestValue(request.request_type)} />
            <Detail label="Experience" value={formatAccessRequestValue(request.experience_level)} />
            <Detail label="Organization" value={request.school_or_organization} />
            <Detail label="Availability" value={request.availability_notes || "Not provided"} />
          </dl>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">{request.reason}</p>
        </section>
      )}
      {canWithdraw ? (
        <form action={withdrawAccessRequestAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <button className="text-sm font-medium text-destructive hover:underline" type="submit">
            Withdraw request
          </button>
        </form>
      ) : null}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
