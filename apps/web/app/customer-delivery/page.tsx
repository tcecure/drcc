import type { Metadata } from "next";

import { CallToAction } from "@/components/organisms/call-to-action";
import { FeatureGrid } from "@/components/organisms/feature-grid";
import { PageHeader } from "@/components/templates/page-header";

export const metadata: Metadata = {
  title: "Customer Delivery Zone",
  description:
    "Learn how the isolated Customer Delivery Zone supports approved assessments, vulnerability reviews, collaboration, reporting, and readiness work.",
};

const deliveryFeatures = [
  { title: "Approved customer assessments" },
  { title: "Vulnerability reviews" },
  { title: "Secure collaboration" },
  { title: "Reporting" },
  { title: "Readiness work" },
];

export default function CustomerDeliveryPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="Customer Delivery Zone"
        description="An isolated environment for approved customer security support and readiness workflows."
      />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">Separate by design</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The Customer Delivery Zone supports customer-facing work without
            blending protected engagements into normal student access.
          </p>
          <p className="mt-5 rounded-lg border border-primary/30 bg-primary/10 p-4 font-medium text-primary">
            It is not part of normal student access.
          </p>
        </div>
        <FeatureGrid features={deliveryFeatures} columns="two" />
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Ask about customer support"
          description="Contact the clinic team to discuss readiness support, assessment preparation, or collaboration needs."
          primaryHref="/contact"
          primaryLabel="Contact DigitalRCC"
          secondaryHref="/about"
          secondaryLabel="About the Clinic"
        />
      </div>
    </main>
  );
}
