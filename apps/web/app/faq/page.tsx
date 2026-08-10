import type { Metadata } from "next";

import { CallToAction } from "@/components/organisms/call-to-action";
import { FAQAccordion } from "@/components/organisms/faq-accordion";
import { PageHeader } from "@/components/templates/page-header";
import { faqs } from "@/lib/content/public-site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about DigitalRCC lab access, queue placement, 14-day windows, and digital lab guides.",
};

export default function FAQPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="Frequently Asked Questions"
        description="Answers about DigitalRCC training labs, queue placement, active lab windows, and student guide access."
      />
      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <FAQAccordion items={faqs} />
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Still have a question?"
          description="Contact the DigitalRCC team or submit a lab access request for approver follow-up."
          primaryHref="/contact"
          primaryLabel="Contact"
          secondaryHref="/request-access"
          secondaryLabel="Request Access"
        />
      </div>
    </main>
  );
}
