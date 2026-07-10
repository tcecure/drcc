import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

export default async function SupportPage() {
  const user = await requireAuthenticatedUser();
  const roles = await getUserRoles();
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("support_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Support</h1>
          <p className="mt-3 text-muted-foreground">Track lab support requests and updates.</p>
        </div>
        <Link className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/dashboard/support/new">
          New request
        </Link>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(requests ?? []).map((request) => (
            <Link className="grid gap-3 p-5 text-sm hover:bg-muted/60 md:grid-cols-[1fr_auto]" href={`/dashboard/support/${request.id}`} key={request.id}>
              <span>
                <span className="block font-medium">{request.subject}</span>
                <span className="text-muted-foreground capitalize">{request.category.replaceAll("_", " ")}</span>
              </span>
              <span className="font-medium capitalize">{request.status.replaceAll("_", " ")}</span>
            </Link>
          ))}
          {requests?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No support requests yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
