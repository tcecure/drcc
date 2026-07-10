import { DashboardNav } from "@/components/organisms/dashboard-nav";
import {
  assignCustomerEngagementMemberAction,
  createCustomerEngagementAction,
  revokeCustomerAccessAction,
} from "@/lib/customer-delivery/actions";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminCustomerDeliveryPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function AdminCustomerDeliveryPage({ searchParams }: AdminCustomerDeliveryPageProps) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  const [{ data: engagements }, { data: users }, { data: memberships }] = await Promise.all([
    supabase.from("customer_engagements").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, email, full_name, organization").order("email"),
    supabase.from("customer_engagement_members").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const engagementMap = new Map((engagements ?? []).map((engagement) => [engagement.id, engagement]));
  const userMap = new Map((users ?? []).map((user) => [user.id, user]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Customer Delivery Zone</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Manage metadata-only customer engagement records and time-limited staff access.
        </p>
      </section>
      {params.error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{params.error}</p> : null}
      {params.message ? <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{params.message}</p> : null}
      <section className="rounded-lg border border-primary/30 bg-primary/10 p-5 text-sm text-primary">
        No controlled files, CUI, evidence, scan details, credentials, assessment artifacts, penetration test data, or reports may be stored here.
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <form action={createCustomerEngagementAction} className="grid gap-4 rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Create engagement metadata</h2>
          <TextInput label="Engagement name" name="engagementName" />
          <TextInput label="Customer display name" name="customerDisplayName" />
          <Select label="Engagement type" name="engagementType" options={["readiness_support", "assessment_prep", "vulnerability_review", "secure_collaboration", "other"]} />
          <Select label="Status" name="status" options={["planning", "active", "paused", "completed", "archived"]} />
          <TextInput label="Start date" name="startDate" type="date" />
          <TextInput label="End date" name="endDate" type="date" />
          <TextInput label="Controlled workspace URL" name="internalWorkspaceUrl" />
          <label className="grid gap-2 text-sm font-medium">
            Classification notice
            <textarea
              className="min-h-24 rounded-md border bg-background p-3"
              name="classificationNotice"
              defaultValue="Metadata only. Customer material remains in the controlled environment."
            />
          </label>
          <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
            Create engagement
          </button>
        </form>
        <form action={assignCustomerEngagementMemberAction} className="grid gap-4 rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Assign staff access</h2>
          <label className="grid gap-2 text-sm font-medium">
            Engagement
            <select className="h-11 rounded-md border bg-background px-3" name="engagementId" required>
              {(engagements ?? []).map((engagement) => (
                <option key={engagement.id} value={engagement.id}>{engagement.engagement_name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            User
            <select className="h-11 rounded-md border bg-background px-3" name="userId" required>
              {(users ?? []).map((user) => (
                <option key={user.id} value={user.id}>{user.full_name || user.email}</option>
              ))}
            </select>
          </label>
          <Select label="Engagement role" name="engagementRole" options={["viewer", "analyst", "lead", "reviewer", "owner"]} />
          <TextInput label="Access starts" name="accessStartsAt" type="datetime-local" />
          <TextInput label="Access expires" name="accessExpiresAt" type="datetime-local" />
          <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
            Assign access
          </button>
        </form>
      </section>
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold">Current access</h2>
        </div>
        <div className="divide-y">
          {(memberships ?? []).map((member) => {
            const engagement = engagementMap.get(member.engagement_id);
            const profile = userMap.get(member.user_id);
            return (
              <article className="grid gap-3 p-5 text-sm lg:grid-cols-[1fr_1fr_auto]" key={member.id}>
                <div>
                  <p className="font-medium">{engagement?.engagement_name ?? member.engagement_id}</p>
                  <p className="text-muted-foreground">{profile?.full_name || profile?.email || member.user_id}</p>
                </div>
                <div>
                  <p className="capitalize">{member.engagement_role} / {member.status}</p>
                  <p className="text-muted-foreground">{member.access_expires_at ? `Expires ${new Date(member.access_expires_at).toLocaleString()}` : "No expiration set"}</p>
                </div>
                {member.status === "active" ? (
                  <form action={revokeCustomerAccessAction}>
                    <input type="hidden" name="engagementId" value={member.engagement_id} />
                    <input type="hidden" name="userId" value={member.user_id} />
                    <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" type="submit">Revoke</button>
                  </form>
                ) : null}
              </article>
            );
          })}
          {memberships?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No customer access assigned.</p> : null}
        </div>
      </section>
    </main>
  );
}

function TextInput({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input className="h-11 rounded-md border bg-background px-3" name={name} type={type} />
    </label>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select className="h-11 rounded-md border bg-background px-3 capitalize" name={name} required>
        {options.map((option) => (
          <option key={option} value={option}>{option.replaceAll("_", " ")}</option>
        ))}
      </select>
    </label>
  );
}
