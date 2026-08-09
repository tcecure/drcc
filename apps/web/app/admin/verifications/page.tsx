import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminVerificationsPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const supabase = createAdminClient();
  const { data: verifications } = await supabase
    .from("lab_verifications")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(100);
  const userIds = [...new Set((verifications ?? []).map((verification) => verification.user_id))];
  const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds) : { data: [] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Lab verifications</h1>
        <p className="mt-3 text-muted-foreground">Review student verification history and outcomes.</p>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(verifications ?? []).map((verification) => {
            const profile = profileMap.get(verification.user_id);
            return (
              <article className="grid gap-3 p-5 text-sm md:grid-cols-[1fr_1fr_auto]" key={verification.id}>
                <div>
                  <p className="font-medium">{profile?.full_name || profile?.email || verification.user_id}</p>
                  <p className="text-muted-foreground capitalize">{verification.verification_type.replaceAll("_", " ")}</p>
                </div>
                <p className="capitalize">{verification.status}</p>
                <p>{verification.score ?? "No score"}</p>
              </article>
            );
          })}
          {verifications?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No verifications yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
