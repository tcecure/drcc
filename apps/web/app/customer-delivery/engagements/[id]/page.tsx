import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function CustomerEngagementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuthenticatedUser();
  const [{ id }, roles] = await Promise.all([params, getUserRoles()]);
  const supabase = createAdminClient();
  const { data: membership } = await supabase
    .from("customer_engagement_members")
    .select("*")
    .eq("engagement_id", id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  const now = Date.now();
  if (!membership || new Date(membership.access_starts_at).getTime() > now || (membership.access_expires_at && new Date(membership.access_expires_at).getTime() <= now)) {
    redirect("/unauthorized");
  }

  const { data: engagement } = await supabase.from("customer_engagements").select("*").eq("id", id).single();

  if (!engagement) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/customer-delivery/engagements">Back to engagements</Link>
        <h1 className="mt-4 text-4xl font-semibold">{engagement.engagement_name}</h1>
        <p className="mt-3 text-muted-foreground">{engagement.customer_display_name}</p>
      </section>
      <section className="rounded-lg border border-primary/30 bg-primary/10 p-5 text-sm text-primary">
        {engagement.classification_notice}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Detail label="Engagement type" value={engagement.engagement_type.replaceAll("_", " ")} />
        <Detail label="Status" value={engagement.status} />
        <Detail label="Access expires" value={membership.access_expires_at ? new Date(membership.access_expires_at).toLocaleString() : "Not set"} />
        <Detail label="MFA status" value="Required placeholder" />
      </section>
      {engagement.internal_workspace_url ? (
        <Link className="inline-flex h-11 w-fit items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" href={engagement.internal_workspace_url}>
          Open controlled workspace
        </Link>
      ) : null}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-sm shadow-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium capitalize">{value}</p>
    </div>
  );
}
