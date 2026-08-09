import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import {
  formatAccessRequestValue,
  requestStatusOptions,
  requestTypeOptions,
  type AccessRequest,
} from "@/lib/access/options";
import {
  getUserRoles,
  requireAnyRole,
  roleManagerRoles,
} from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type ApprovalsPageProps = {
  searchParams: Promise<{
    status?: AccessRequest["status"];
    program?: AccessRequest["request_type"];
    q?: string;
    error?: string;
  }>;
};

type ProfileSummary = {
  id: string;
  email: string;
  full_name: string;
  organization: string;
};

export default async function ApprovalsPage({
  searchParams,
}: ApprovalsPageProps) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  let query = supabase
    .from("access_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.program) {
    query = query.eq("request_type", params.program);
  }

  const { data: requests } = await query;
  const userIds = [...new Set((requests ?? []).map((request) => request.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, email, full_name, organization")
        .in("id", userIds)
    : { data: [] as ProfileSummary[] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const filteredRequests = (requests ?? []).filter((request) => {
    if (!params.q) {
      return true;
    }

    const profile = profileMap.get(request.user_id);
    const haystack = [
      profile?.email,
      profile?.full_name,
      profile?.organization,
      request.requested_program,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(params.q.toLowerCase());
  });
  const counts = {
    pending: (requests ?? []).filter((request) => request.status === "submitted").length,
    underReview: (requests ?? []).filter((request) => request.status === "under_review").length,
    moreInfo: (requests ?? []).filter((request) => request.status === "more_information_required").length,
    approved: (requests ?? []).filter((request) => request.status === "approved").length,
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Request submissions</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Admins and approvers can review submitted requests, request more
          information, approve access, or deny access.
        </p>
      </section>
      {params.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QueueStat label="Submitted" value={counts.pending} />
        <QueueStat label="Under review" value={counts.underReview} />
        <QueueStat label="Needs info" value={counts.moreInfo} />
        <QueueStat label="Approved" value={counts.approved} />
      </section>
      <form className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_1fr_1.4fr_auto]">
        <select className="h-11 rounded-md border bg-background px-3 text-sm" name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          {requestStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select className="h-11 rounded-md border bg-background px-3 text-sm" name="program" defaultValue={params.program ?? ""}>
          <option value="">All programs</option>
          {requestTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input
          className="h-11 rounded-md border bg-background px-3 text-sm"
          name="q"
          placeholder="Search name, email, organization, or program"
          defaultValue={params.q ?? ""}
        />
        <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
          Filter
        </button>
      </form>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Requests</h2>
        </div>
        <div className="divide-y">
          {filteredRequests.map((request) => {
            const profile = profileMap.get(request.user_id);

            return (
              <Link
                className="grid gap-3 p-5 text-sm hover:bg-muted/60 lg:grid-cols-[1fr_1fr_auto]"
                href={`/dashboard/approvals/${request.id}`}
                key={request.id}
              >
                <span>
                  <span className="block font-medium">{request.requested_program}</span>
                  <span className="text-muted-foreground">
                    {profile?.full_name || profile?.email || request.user_id}
                  </span>
                </span>
                <span>
                  <span className="block capitalize">{formatAccessRequestValue(request.request_type)}</span>
                  <span className="text-muted-foreground">{profile?.organization}</span>
                </span>
                <span className="font-medium capitalize">{formatAccessRequestValue(request.status)}</span>
              </Link>
            );
          })}
          {filteredRequests.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No matching requests.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function QueueStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
