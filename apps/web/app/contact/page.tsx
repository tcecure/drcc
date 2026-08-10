import type { Metadata } from "next";

import { CallToAction } from "@/components/organisms/call-to-action";
import { PageHeader } from "@/components/templates/page-header";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact DigitalRCC about student lab access, digital lab guides, queue status, or training support.",
};

export default function ContactPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="Contact DigitalRCC"
        description="Reach out about training labs, student guide access, queue placement, or support during an active lab window."
      />
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
        {[
          {
            title: "Training",
            text: "Ask about CMMC Level 1 learning paths and student training steps.",
          },
          {
            title: "Hands-on labs",
            text: "Ask about access requests, the student queue, or your 14-day lab window.",
          },
          {
            title: "Digital guides",
            text: "Get help finding the right lab guide or understanding expected progress.",
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
          title="Request student lab access"
          description="Submit a lab access request so an approver can review it and place you into the queue."
          primaryHref="/request-access"
          primaryLabel="Request Access"
          secondaryHref="/faq"
          secondaryLabel="Read FAQ"
        />
      </div>
    </main>
  );
}
