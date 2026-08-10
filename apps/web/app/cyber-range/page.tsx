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
            Access approvals, safety boundaries, queue placement, and provisioning
            controls keep the 20-seat hands-on environment stable.
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
              Hands-on access is separate from reading the digital lab guides.
              Students can study guides at any time, then use their assigned
              14-day window once a Student01 through Student20 seat is available.
            </p>
          </div>
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Request a hands-on lab window"
          description="Submit an access request so an approver can review it and place you into the student lab queue."
          primaryHref="/request-access"
          primaryLabel="Request Access"
          secondaryHref="/training"
          secondaryLabel="Explore Training"
        />
      </div>
    </main>
  );
}
