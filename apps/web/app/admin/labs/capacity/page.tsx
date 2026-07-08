import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { updateLabCapacitySettingsAction } from "@/lib/labs/actions";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";

type CapacityPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LabCapacitySettingsPage({ searchParams }: CapacityPageProps) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);
  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from("lab_capacity_settings")
    .select("*")
    .is("lab_track_id", null)
    .single();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <Link className="text-sm font-medium text-primary hover:underline" href="/admin/labs">Back to labs</Link>
        <h1 className="mt-4 text-4xl font-semibold">Capacity settings</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          Global hands-on lab limits used before track-specific overrides exist.
        </p>
      </section>
      {params.error ? <Message tone="error" message={params.error} /> : null}
      {params.message ? <Message tone="success" message={params.message} /> : null}
      {settings ? (
        <form action={updateLabCapacitySettingsAction} className="grid gap-5 rounded-lg border bg-card p-6 shadow-sm">
          <input type="hidden" name="capacitySettingsId" value={settings.id} />
          <NumberField label="Maximum active students" name="maximumActive" value={settings.maximum_active} />
          <NumberField label="Maximum reserved slots" name="maximumReserved" value={settings.maximum_reserved} />
          <NumberField label="Confirmation window hours" name="confirmationWindowHours" value={settings.confirmation_window_hours} />
          <NumberField label="Inactivity warning hours" name="inactivityWarningHours" value={settings.inactivity_warning_hours} />
          <NumberField label="Standard duration days" name="standardDurationDays" value={settings.standard_duration_days} />
          <NumberField label="Maximum extension days" name="maximumExtensionDays" value={settings.maximum_extension_days} />
          <label className="flex gap-3 text-sm leading-6">
            <input className="mt-1 h-4 w-4" name="automaticExpirationEnabled" type="checkbox" defaultChecked={settings.automatic_expiration_enabled} />
            <span>Automatic expiration enabled</span>
          </label>
          <button className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">
            Save settings
          </button>
        </form>
      ) : (
        <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">Capacity settings have not been seeded yet.</p>
      )}
    </main>
  );
}

function NumberField({ label, name, value }: { label: string; name: string; value: number }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input className="h-11 rounded-md border bg-background px-3 text-sm" name={name} type="number" defaultValue={value} />
    </label>
  );
}

function Message({ tone, message }: { tone: "error" | "success"; message: string }) {
  const className =
    tone === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-primary/30 bg-primary/10 text-primary";

  return <p className={`rounded-md border p-3 text-sm ${className}`}>{message}</p>;
}
