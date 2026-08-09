import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { acceptLabReservationAction, declineLabReservationAction } from "@/lib/labs/actions";
import { formatLabValue } from "@/lib/labs/queue";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

type ReservationPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LabReservationPage({ searchParams }: ReservationPageProps) {
  const user = await requireAuthenticatedUser();
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("lab_assignments")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["reservation_offered", "reserved"])
    .order("created_at", { ascending: false });
  const instanceIds = [...new Set((assignments ?? []).map((assignment) => assignment.lab_instance_id))];
  const { data: instances } = instanceIds.length
    ? await supabase.from("lab_instances").select("*").in("id", instanceIds)
    : { data: [] };
  const instanceMap = new Map((instances ?? []).map((instance) => [instance.id, instance]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Lab reservation</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Accept or decline available hands-on lab reservations.
        </p>
      </section>
      {params.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {params.error}
        </p>
      ) : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(assignments ?? []).map((assignment) => {
            const instance = instanceMap.get(assignment.lab_instance_id);

            return (
              <article className="grid gap-4 p-5 text-sm md:grid-cols-[1fr_auto]" key={assignment.id}>
                <div>
                  <h2 className="font-medium">{instance?.pod_name ?? "Lab pod"}</h2>
                  <p className="mt-1 text-muted-foreground capitalize">{formatLabValue(assignment.status)}</p>
                  <p className="mt-1 text-muted-foreground">{assignment.expires_at ?? "Expiration starts after acceptance."}</p>
                </div>
                {assignment.status === "reservation_offered" ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={acceptLabReservationAction}>
                      <input type="hidden" name="assignmentId" value={assignment.id} />
                      <button className="h-10 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">
                        Accept
                      </button>
                    </form>
                    <form action={declineLabReservationAction}>
                      <input type="hidden" name="assignmentId" value={assignment.id} />
                      <button className="h-10 rounded-md border px-3 text-sm font-medium hover:bg-muted" type="submit">
                        Decline
                      </button>
                    </form>
                  </div>
                ) : null}
              </article>
            );
          })}
          {assignments?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No reservation offers are waiting.</p> : null}
        </div>
      </section>
    </main>
  );
}
