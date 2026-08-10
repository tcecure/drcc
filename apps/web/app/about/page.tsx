import type { Metadata } from "next";

import { CallToAction } from "@/components/organisms/call-to-action";
import { FeatureGrid } from "@/components/organisms/feature-grid";
import { PageHeader } from "@/components/templates/page-header";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how DigitalRCC supports student cybersecurity training through guided labs, queue management, and progress tracking.",
};

const values = [
  {
    title: "Accessible education",
    description:
      "Cybersecurity concepts are presented in clear, practical language for students.",
  },
  {
    title: "Guided practice",
    description:
      "Students build confidence through structured labs, documented procedures, and supervised technical work.",
  },
  {
    title: "Managed capacity",
    description:
      "Student lab windows are queued around the 20 concurrent hands-on seats the environment can support.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="About DigitalRCC"
        description="DigitalRCC is a student lab companion for guided cybersecurity training, hands-on access, and progress tracking."
      />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">Training, practice, and progress in one place</h2>
        </div>
        <div className="flex flex-col gap-5 leading-7 text-muted-foreground">
          <p>
            DigitalRCC helps students move from access request to queue
            placement to an active hands-on lab window. The companion keeps
            digital lab guides, progress status, and student support close to
            the work students are doing.
          </p>
          <p>
            The hands-on environment is intentionally capacity-managed. The
            portal supports Student01 through Student20 lab seats and gives
            each approved student a 14-day completion window.
          </p>
        </div>
      </section>
      <section className="border-y bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold">Lab companion principles</h2>
          <FeatureGrid features={values} />
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Start with a lab access request"
          description="Request access, enter the student queue after approval, and use the digital guides while you wait."
          primaryHref="/request-access"
          primaryLabel="Request Access"
          secondaryHref="/contact"
          secondaryLabel="Contact"
        />
      </div>
    </main>
  );
}
