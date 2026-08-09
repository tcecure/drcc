import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { reviewCustomerAccessAction } from "@/lib/customer-delivery/actions";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type AccessReviewsPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function CustomerAccessReviewsPage({ searchParams }: AccessReviewsPageProps) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  const [{ data: memberships }, { data: engagements }, { data: users }, { data: reviews }] = await Promise.all([
    supabase.from("customer_engagement_members").select("*").order("created_at", { ascending: false }),
    supabase.from("customer_engagements").select("id, engagement_name"),
    supabase.from("profiles").select("id, email, full_name"),
    supabase.from("customer_access_reviews").select("*").order("reviewed_at", { ascending: false }).limit(100),
  ]);
  const engagementMap = new Map((engagements ?? []).map((engagement) => [engagement.id, engagement]));
  const userMap = new Map((users ?? []).map((user) => [user.id, user]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Customer access reviews</h1>
        <p className="mt-3 text-muted-foreground">Review, approve, or revoke time-limited Customer Delivery Zone access.</p>
      </section>
      {params.error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{params.error}</p> : null}
      {params.message ? <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{params.message}</p> : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(memberships ?? []).map((member) => {
            const engagement = engagementMap.get(member.engagement_id);
            const profile = userMap.get(member.user_id);
            return (
              <form action={reviewCustomerAccessAction} className="grid gap-3 p-5 text-sm lg:grid-cols-[1fr_1fr_auto]" key={member.id}>
                <input type="hidden" name="engagementId" value={member.engagement_id} />
                <input type="hidden" name="userId" value={member.user_id} />
                <div>
                  <p className="font-medium">{engagement?.engagement_name ?? member.engagement_id}</p>
                  <p className="text-muted-foreground">{profile?.full_name || profile?.email || member.user_id}</p>
                </div>
                <div className="grid gap-2">
                  <select className="h-10 rounded-md border bg-background px-3" name="reviewStatus" defaultValue="approved">
                    <option value="approved">Approved</option>
                    <option value="needs_review">Needs review</option>
                    <option value="revoked">Revoked</option>
                  </select>
                  <input className="h-10 rounded-md border bg-background px-3" name="reviewNotes" placeholder="Review notes" />
                </div>
                <button className="h-10 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">
                  Record review
                </button>
              </form>
            );
          })}
        </div>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Recent reviews</h2>
        </div>
        <div className="divide-y">
          {(reviews ?? []).map((review) => (
            <article className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_auto]" key={review.id}>
              <div>
                <p className="font-medium">{engagementMap.get(review.engagement_id)?.engagement_name ?? review.engagement_id}</p>
                <p className="text-muted-foreground">{userMap.get(review.user_id)?.email ?? review.user_id}</p>
              </div>
              <p className="font-medium capitalize">{review.review_status.replaceAll("_", " ")}</p>
            </article>
          ))}
          {reviews?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No access reviews yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
