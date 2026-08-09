import type { Metadata } from "next";

import { CallToAction } from "@/components/organisms/call-to-action";
import { FeatureGrid } from "@/components/organisms/feature-grid";
import { PageHeader } from "@/components/templates/page-header";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how DigitalRCC connects cybersecurity education, workforce development, hands-on experience, and community security support.",
};

const values = [
  {
    title: "Accessible education",
    description:
      "Cybersecurity concepts are presented in clear, practical language for learners and community partners.",
  },
  {
    title: "Guided practice",
    description:
      "Students build confidence through structured labs, documented procedures, and supervised technical work.",
  },
  {
    title: "Community support",
    description:
      "Small businesses and organizations receive readiness help without exposing protected systems to normal student access.",
  },
];

export default function AboutPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="About the Digital Resilience Community Clinic"
        description="DigitalRCC is a community technology clinic that helps learners and organizations build practical cybersecurity resilience."
      />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">Education, practice, and service in one clinic model</h2>
        </div>
        <div className="flex flex-col gap-5 leading-7 text-muted-foreground">
          <p>
            DigitalRCC brings together cybersecurity education, practical lab
            experience, workforce development, and community security support.
            The clinic model gives students structured ways to learn while
            helping organizations understand foundational safeguards.
          </p>
          <p>
            Public resources and training pathways stay approachable. Protected
            customer work and infrastructure integrations stay separated behind
            controlled access, server-side workflows, and future audit logging.
          </p>
        </div>
      </section>
      <section className="border-y bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold">Clinic principles</h2>
          <FeatureGrid features={values} />
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Connect with the clinic"
          description="Share your interest in training, lab work, resources, or community security support."
          primaryHref="/request-access"
          primaryLabel="Request Access"
          secondaryHref="/contact"
          secondaryLabel="Contact"
        />
      </div>
    </main>
  );
}
