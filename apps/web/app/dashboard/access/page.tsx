import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { formatAccessRequestValue } from "@/lib/access/options";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

type AccessPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AccessRequestsPage({ searchParams }: AccessPageProps) {
  const user = await requireAuthenticatedUser();
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("access_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Access requests</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            Request access to training, labs, protected zones, or elevated portal workflows.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          href="/dashboard/access/new"
        >
          New request
        </Link>
      </section>
      {params.error ? <StatusMessage tone="error" message={params.error} /> : null}
      {params.message ? <StatusMessage tone="success" message={params.message} /> : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">My requests</h2>
        </div>
        <div className="divide-y">
          {(requests ?? []).map((request) => (
            <Link
              className="grid gap-2 p-5 text-sm hover:bg-muted/60 sm:grid-cols-[1fr_auto]"
              href={`/dashboard/access/${request.id}`}
              key={request.id}
            >
              <span>
                <span className="block font-medium">{request.requested_program}</span>
                <span className="text-muted-foreground">
                  {formatAccessRequestValue(request.request_type)}
                </span>
              </span>
              <span className="font-medium capitalize">
                {formatAccessRequestValue(request.status)}
              </span>
            </Link>
          ))}
          {requests?.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No access requests yet.</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function StatusMessage({ tone, message }: { tone: "error" | "success"; message: string }) {
  const className =
    tone === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-primary/30 bg-primary/10 text-primary";

  return <p className={`rounded-md border p-3 text-sm ${className}`}>{message}</p>;
}
