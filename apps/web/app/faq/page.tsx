import type { Metadata } from "next";

import { CallToAction } from "@/components/organisms/call-to-action";
import { FAQAccordion } from "@/components/organisms/faq-accordion";
import { PageHeader } from "@/components/templates/page-header";
import { faqs } from "@/lib/content/public-site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about DigitalRCC access, Cyber Range boundaries, Customer Delivery Zone use, and pre-registration.",
};

export default function FAQPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="Frequently Asked Questions"
        description="Answers about DigitalRCC training, lab access, customer delivery boundaries, and pre-registration."
      />
      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <FAQAccordion items={faqs} />
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Still have a question?"
          description="Contact the clinic team or pre-register your interest for follow-up in a future workflow."
          primaryHref="/contact"
          primaryLabel="Contact"
          secondaryHref="/request-access"
          secondaryLabel="Request Access"
        />
      </div>
    </main>
  );
}
