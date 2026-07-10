import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { createSupportRequestAction } from "@/lib/labs/experience-actions";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

type NewSupportPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewSupportPage({ searchParams }: NewSupportPageProps) {
  const user = await requireAuthenticatedUser();
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("lab_assignments")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["provisioning", "active"])
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">New support request</h1>
        <p className="mt-3 text-muted-foreground">Share what is blocking your lab work.</p>
      </section>
      {params.error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{params.error}</p> : null}
      <form action={createSupportRequestAction} className="grid gap-4 rounded-lg border bg-card p-5 shadow-sm">
        <label className="grid gap-2 text-sm font-medium">
          Lab assignment
          <select className="h-11 rounded-md border bg-background px-3" name="labAssignmentId">
            <option value="">General support</option>
            {(assignments ?? []).map((assignment) => (
              <option key={assignment.id} value={assignment.id}>{assignment.status}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Category
          <select className="h-11 rounded-md border bg-background px-3" name="category" required>
            <option value="connectivity">Connectivity</option>
            <option value="guacamole">Guacamole</option>
            <option value="vpn">VPN</option>
            <option value="lab_guide">Lab guide</option>
            <option value="verification">Verification</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Priority
          <select className="h-11 rounded-md border bg-background px-3" name="priority" required>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Subject
          <input className="h-11 rounded-md border bg-background px-3" name="subject" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Description
          <textarea className="min-h-36 rounded-md border bg-background p-3" name="description" required />
        </label>
        <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
          Submit request
        </button>
      </form>
    </main>
  );
}
