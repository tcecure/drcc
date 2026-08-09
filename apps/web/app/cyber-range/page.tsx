import type { Metadata } from "next";

import { CallToAction } from "@/components/organisms/call-to-action";
import { PageHeader } from "@/components/templates/page-header";
import { cyberRangeCapabilities } from "@/lib/content/public-site";

export const metadata: Metadata = {
  title: "Cyber Range",
  description:
    "Preview DigitalRCC Cyber Range capabilities including Windows, Active Directory, Linux, monitoring, hardening, and incident response labs.",
};

export default function CyberRangePage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="Cyber Range"
        description="Practice defensive operations through guided labs that connect systems, monitoring, hardening, assessment, and incident response."
      />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">Hands-on technical experience</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The range is built for structured practice, not unrestricted access.
            Access approvals, safety boundaries, and provisioning controls will
            be implemented through later portal workflows.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {cyberRangeCapabilities.map((capability) => (
            <li
              key={capability}
              className="rounded-lg border bg-card px-4 py-3 text-sm shadow-sm"
            >
              {capability}
            </li>
          ))}
        </ul>
      </section>
      <section className="border-y bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border bg-card p-7 shadow-sm">
            <h2 className="text-2xl font-semibold">Access boundary</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Cyber Range access is separate from normal portal access. Future
              sprints will connect waitlists, approvals, and lab provisioning
              through protected server-side workflows.
            </p>
          </div>
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Join the Cyber Range interest list"
          description="Use pre-registration to indicate lab interest while full account registration and waitlist workflows are being prepared."
          primaryHref="/request-access"
          primaryLabel="Request Access"
          secondaryHref="/training"
          secondaryLabel="Explore Training"
        />
      </div>
    </main>
  );
}
