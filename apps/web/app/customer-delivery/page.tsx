import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function CustomerDeliveryPage() {
  const user = await requireAuthenticatedUser();
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const { data: memberships } = await supabase
    .from("customer_engagement_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");
  const activeMemberships = (memberships ?? []).filter((member) => {
    const starts = new Date(member.access_starts_at).getTime();
    const expires = member.access_expires_at ? new Date(member.access_expires_at).getTime() : Number.POSITIVE_INFINITY;
    const now = Date.now();
    return starts <= now && expires > now;
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Customer Delivery Zone</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Metadata-only access for approved customer engagements. Customer material remains in the controlled environment.
        </p>
      </section>
      <section className="rounded-lg border border-primary/30 bg-primary/10 p-5 text-sm text-primary">
        Public portal records contain engagement metadata only. Do not upload CUI, evidence, reports, credentials, scan data, or assessment artifacts.
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Link className="rounded-lg border bg-card p-5 shadow-sm hover:bg-muted/60" href="/customer-delivery/engagements">
          <h2 className="text-lg font-semibold">My engagements</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            View approved engagement metadata and controlled workspace links.
          </p>
        </Link>
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">MFA status</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            MFA requirement placeholder. Access requires staff approval and current engagement membership.
          </p>
        </div>
      </section>
      {!activeMemberships.length ? (
        <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
          You do not currently have active Customer Delivery Zone engagement access.
        </p>
      ) : null}
    </main>
  );
}
