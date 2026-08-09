import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminSupportPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminSupportPage({ searchParams }: AdminSupportPageProps) {
  await requireAnyRole(roleManagerRoles);
  const [roles, query] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  const { data: requests } = await supabase
    .from("support_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  const userIds = [...new Set((requests ?? []).map((request) => request.user_id))];
  const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds) : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Support requests</h1>
        <p className="mt-3 text-muted-foreground">Review student lab support needs.</p>
      </section>
      {query.error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{query.error}</p> : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(requests ?? []).map((request) => {
            const profile = profileMap.get(request.user_id);
            return (
              <Link className="grid gap-3 p-5 text-sm hover:bg-muted/60 md:grid-cols-[1fr_1fr_auto]" href={`/admin/support/${request.id}`} key={request.id}>
                <span>
                  <span className="block font-medium">{request.subject}</span>
                  <span className="text-muted-foreground">{profile?.full_name || profile?.email || request.user_id}</span>
                </span>
                <span className="capitalize">{request.category.replaceAll("_", " ")} / {request.priority}</span>
                <span className="font-medium capitalize">{request.status.replaceAll("_", " ")}</span>
              </Link>
            );
          })}
          {requests?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No support requests yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
