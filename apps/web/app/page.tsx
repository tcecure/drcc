import type { Metadata } from "next";
import Link from "next/link";

import { CallToAction } from "@/components/organisms/call-to-action";
import { FAQAccordion } from "@/components/organisms/faq-accordion";
import { FeatureGrid } from "@/components/organisms/feature-grid";
import { Hero } from "@/components/organisms/hero";
import { ProgramCard } from "@/components/molecules/program-card";
import { ResourcePreviewCard } from "@/components/molecules/resource-preview-card";
import {
  cmmcPractices,
  cyberRangeCapabilities,
  faqs,
  programAreas,
  resourcePreviews,
} from "@/lib/content/public-site";

export const metadata: Metadata = {
  title: "Digital Resilience Community Clinic",
  description:
    "DigitalRCC combines cybersecurity education, practical lab experience, workforce development, and community security support.",
};

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">A community clinic for digital resilience</h2>
        </div>
        <div className="flex flex-col gap-5 text-base leading-7 text-muted-foreground">
          <p>
            DigitalRCC combines cybersecurity education, practical lab
            experience, workforce development, and community security support
            in one approachable program.
          </p>
          <p>
            Students gain guided experience while organizations get clearer
            pathways for foundational safeguards, readiness work, and secure
            collaboration.
          </p>
        </div>
      </section>
      <section className="border-y bg-muted/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold">Program areas</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Explore the public pathways that connect learning, practice,
              customer support, and student resources.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {programAreas.map((program) => (
              <ProgramCard key={program.title} {...program} />
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">CMMC Level 1 training</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Training introduces foundational cybersecurity practices for
            protecting Federal Contract Information with practical examples,
            plain-language guidance, and evidence awareness.
          </p>
          <Link className="mt-6 inline-flex text-sm font-medium text-primary" href="/training">
            View training details
          </Link>
        </div>
        <FeatureGrid features={cmmcPractices} columns="two" />
      </section>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold">Cyber Range</h2>
            <p className="mt-4 leading-7 text-primary-foreground/80">
              Guided labs help learners practice core defensive operations
              across realistic systems while staying inside approved access
              boundaries.
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
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-lg border bg-card p-7 shadow-sm">
          <h2 className="text-2xl font-semibold">Customer Delivery Zone</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The Customer Delivery Zone is an isolated environment used for
            approved customer assessments, vulnerability reviews, secure
            collaboration, reporting, and readiness work.
          </p>
          <p className="mt-4 font-medium">
            It is not part of normal student access.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Student resources</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Students can preview the support library that will collect guides,
            references, templates, certification guidance, and career resources.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {resourcePreviews.slice(0, 4).map((resource) => (
              <ResourcePreviewCard key={resource.title} {...resource} />
            ))}
          </div>
        </div>
      </section>
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div>
            <h2 className="text-3xl font-semibold">Common questions</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Quick answers about access, training, customer work, and current
              pre-registration.
            </p>
          </div>
          <FAQAccordion items={faqs.slice(0, 4)} />
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Start with pre-registration"
          description="Tell the clinic team what you need so the next access workflow can route you toward training, resources, or approved program support."
          primaryHref="/request-access"
          primaryLabel="Request Access"
          secondaryHref="/contact"
          secondaryLabel="Contact DigitalRCC"
        />
      </div>
    </main>
  );
}
