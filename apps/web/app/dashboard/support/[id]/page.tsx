import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

type SupportDetailProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
};

export default async function SupportDetailPage({ params, searchParams }: SupportDetailProps) {
  const user = await requireAuthenticatedUser();
  const [{ id }, roles, query] = await Promise.all([params, getUserRoles(), searchParams]);
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("support_requests")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!request) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/dashboard/support">Back to support</Link>
        <h1 className="mt-4 text-4xl font-semibold">{request.subject}</h1>
        <p className="mt-3 text-muted-foreground capitalize">{request.status.replaceAll("_", " ")}</p>
      </section>
      {query.message ? <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{query.message}</p> : null}
      <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Detail label="Category" value={request.category.replaceAll("_", " ")} />
          <Detail label="Priority" value={request.priority} />
          <Detail label="Created" value={new Date(request.created_at).toLocaleString()} />
        </dl>
        <p className="mt-5 leading-7 text-muted-foreground">{request.description}</p>
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium capitalize">{value}</dd>
    </div>
  );
}
