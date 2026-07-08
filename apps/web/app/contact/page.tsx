import type { Metadata } from "next";

import { CallToAction } from "@/components/organisms/call-to-action";
import { PageHeader } from "@/components/templates/page-header";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact DigitalRCC about cybersecurity training, community security support, resources, or customer delivery readiness.",
};

export default function ContactPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="Contact DigitalRCC"
        description="Reach out about training, cyber range interest, student resources, community security support, or customer delivery readiness."
      />
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
        {[
          {
            title: "Training",
            text: "Ask about CMMC Level 1 learning paths and future enrollment steps.",
          },
          {
            title: "Cyber Range",
            text: "Share interest in hands-on lab practice and future waitlist workflows.",
          },
          {
            title: "Community Support",
            text: "Discuss readiness support, resources, or customer delivery needs.",
          },
        ].map((item) => (
          <article key={item.title} className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.text}
            </p>
          </article>
        ))}
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Pre-register your interest"
          description="The current request-access page captures informational interest while account registration is prepared."
          primaryHref="/request-access"
          primaryLabel="Request Access"
          secondaryHref="/faq"
          secondaryLabel="Read FAQ"
        />
      </div>
    </main>
  );
}
