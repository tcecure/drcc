import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { labGuideSafetyNotes, labGuideSeats, labGuideSections } from "@/lib/labs/guides";
import { getUserRoles, requireAuthenticatedUser } from "@/lib/permissions/roles";

export default async function LabGuidesPage() {
  await requireAuthenticatedUser();
  const roles = await getUserRoles();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section>
        <h1 className="text-4xl font-semibold">Digital lab guides</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Use the same core guide for any assigned lab seat. Select Student01 through Student20 to match your assigned range identity.
        </p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {labGuideSeats.map((seat) => (
          <article className="rounded-lg border bg-card p-4 text-sm shadow-sm" key={seat.username}>
            <p className="text-muted-foreground">{seat.displayName}</p>
            <h2 className="mt-1 text-xl font-semibold">{seat.username}</h2>
            <p className="mt-3 leading-6 text-muted-foreground">
              Use this guide when your active lab assignment references {seat.username}.
            </p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-xl font-semibold">Core lab workflow</h2>
          </div>
          <div className="divide-y">
            {labGuideSections.map((section) => (
              <article className="p-5" key={section.title}>
                <h3 className="font-medium">{section.title}</h3>
                <ol className="mt-3 grid list-decimal gap-2 pl-5 text-sm leading-6 text-muted-foreground">
                  {section.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
        <aside className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Safety notes</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
            {labGuideSafetyNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
