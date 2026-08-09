import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function CustomerEngagementsPage() {
  const user = await requireAuthenticatedUser();
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const { data: memberships } = await supabase
    .from("customer_engagement_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");
  const activeMemberships = (memberships ?? []).filter((member) => {
    const now = Date.now();
    return new Date(member.access_starts_at).getTime() <= now && (!member.access_expires_at || new Date(member.access_expires_at).getTime() > now);
  });

  if (!activeMemberships.length) {
    redirect("/unauthorized");
  }

  const engagementIds = activeMemberships.map((member) => member.engagement_id);
  const { data: engagements } = await supabase
    .from("customer_engagements")
    .select("*")
    .in("id", engagementIds)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Customer engagements</h1>
        <p className="mt-3 text-muted-foreground">Only engagements assigned to you are shown.</p>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(engagements ?? []).map((engagement) => (
            <Link className="grid gap-3 p-5 text-sm hover:bg-muted/60 md:grid-cols-[1fr_auto]" href={`/customer-delivery/engagements/${engagement.id}`} key={engagement.id}>
              <span>
                <span className="block font-medium">{engagement.engagement_name}</span>
                <span className="text-muted-foreground">{engagement.customer_display_name}</span>
              </span>
              <span className="font-medium capitalize">{engagement.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
