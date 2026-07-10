import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { updateSupportRequestStatusAction } from "@/lib/labs/experience-actions";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminSupportDetailProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
};

export default async function AdminSupportDetailPage({ params, searchParams }: AdminSupportDetailProps) {
  await requireAnyRole(roleManagerRoles);
  const [{ id }, roles, query] = await Promise.all([params, getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  const { data: request } = await supabase.from("support_requests").select("*").eq("id", id).single();

  if (!request) {
    notFound();
  }

  const { data: profile } = await supabase.from("profiles").select("email, full_name, organization").eq("id", request.user_id).single();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin/support">Back to support</Link>
        <h1 className="mt-4 text-4xl font-semibold">{request.subject}</h1>
        <p className="mt-3 text-muted-foreground">{profile?.full_name || profile?.email || request.user_id}</p>
      </section>
      {query.message ? <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{query.message}</p> : null}
      <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
        <p className="leading-7 text-muted-foreground">{request.description}</p>
      </section>
      <form action={updateSupportRequestStatusAction} className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-5 shadow-sm">
        <input type="hidden" name="supportRequestId" value={request.id} />
        <label className="grid gap-2 text-sm font-medium">
          Status
          <select className="h-10 rounded-md border bg-background px-3" name="status" defaultValue={request.status}>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="waiting_on_student">Waiting on student</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <button className="h-10 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">
          Update
        </button>
      </form>
    </main>
  );
}
