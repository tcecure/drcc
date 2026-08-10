import type { Metadata } from "next";
import { CallToAction } from "@/components/organisms/call-to-action";
import { FAQAccordion } from "@/components/organisms/faq-accordion";
import { FeatureGrid } from "@/components/organisms/feature-grid";
import { Hero } from "@/components/organisms/hero";
import { ProgramCard } from "@/components/molecules/program-card";
import {
  cyberRangeCapabilities,
  faqs,
  programAreas,
} from "@/lib/content/public-site";

export const metadata: Metadata = {
  title: "DigitalRCC Lab Companion",
  description:
    "DigitalRCC lab companion for student access requests, queue tracking, 14-day lab windows, progress monitoring, and digital guides.",
};

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">Built around the lab journey</h2>
        </div>
        <div className="flex flex-col gap-5 text-base leading-7 text-muted-foreground">
          <p>
            my.digitalrcc.com is the student-facing companion for the
            hands-on training environment. It is focused on access requests,
            queue placement, lab readiness, active progress, and guide access.
          </p>
          <p>
            The hands-on range supports 20 concurrent student seats. Once a
            student receives a lab slot, the lab companion tracks the 14-day
            completion window and the verification steps needed to finish.
          </p>
        </div>
      </section>
      <section className="border-y bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold">Student workflow</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              A smaller, clearer path from request to queue to active lab work.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {programAreas.map((program) => (
              <ProgramCard key={program.title} {...program} />
            ))}
          </div>
        </div>
      </section>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold">Training lab companion</h2>
            <p className="mt-4 leading-7 text-primary-foreground/80">
              Guided lab work stays organized around assigned seats, progress
              checks, verification results, and student support.
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {cyberRangeCapabilities.map((capability) => (
              <li
                key={capability}
                className="rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 text-sm"
              >
                {capability}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold">Common questions</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Quick answers about lab access, queueing, active windows, and
              guide access.
            </p>
          </div>
          <FAQAccordion items={faqs.slice(0, 4)} />
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Start with a lab access request"
          description="Request access, complete approval, and enter the queue for a 14-day hands-on training lab window."
          primaryHref="/request-access"
          primaryLabel="Request Access"
          secondaryHref="/login"
          secondaryLabel="Student Login"
        />
      </div>
    </main>
  );
}
