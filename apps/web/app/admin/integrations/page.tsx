import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { getUserRoles, requireAnyRole, roleManagerRoles } from "@/lib/permissions/roles";
import { readServerEnv } from "@/lib/validation/env";

export default async function IntegrationsPage() {
  await requireAnyRole(roleManagerRoles);
  const roles = await getUserRoles();
  const env = readServerEnv();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Internal integrations</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          The portal creates approved jobs. The internal bridge runs inside the controlled DigitalRCC environment and calls AWX from there.
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Status label="Provisioning mode" value={env.INTEGRATION_MODE} />
        <Status label="Bridge identity" value={env.BRIDGE_ID ? "Configured" : "Not configured"} />
        <Status label="Bridge secret" value={env.BRIDGE_SECRET ? "Configured" : "Not configured"} />
      </section>
      <section className="rounded-lg border bg-card p-5 text-sm shadow-sm">
        <h2 className="text-xl font-semibold">Bridge deployment path</h2>
        <p className="mt-3 text-muted-foreground">integrations/internal-bridge</p>
        <p className="mt-3 leading-6 text-muted-foreground">
          Use mock mode until AWX template IDs and network placement are ready. AWX tokens and template identifiers belong only in the bridge environment, never in the browser.
        </p>
      </section>
    </main>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-sm shadow-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
