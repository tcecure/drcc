import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/lib/notifications/actions";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

type NotificationsPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const user = await requireAuthenticatedUser();
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  const unreadCount = (notifications ?? []).filter((notification) => !notification.read_at).length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Notifications</h1>
          <p className="mt-3 text-muted-foreground">{unreadCount} unread portal updates.</p>
        </div>
        <form action={markAllNotificationsReadAction}>
          <button className="h-10 rounded-md border px-4 text-sm font-medium hover:bg-muted" type="submit">
            Mark all read
          </button>
        </form>
      </section>
      {params.message ? <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{params.message}</p> : null}
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="divide-y">
          {(notifications ?? []).map((notification) => (
            <article className="grid gap-4 p-5 text-sm lg:grid-cols-[1fr_auto]" key={notification.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{notification.title}</h2>
                  {!notification.read_at ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Unread</span>
                  ) : null}
                </div>
                <p className="mt-2 leading-6 text-muted-foreground">{notification.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {notification.action_url ? (
                  <Link className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" href={notification.action_url}>
                    Open
                  </Link>
                ) : null}
                {!notification.read_at ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <button className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted" type="submit">
                      Mark read
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
          {notifications?.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No notifications yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
