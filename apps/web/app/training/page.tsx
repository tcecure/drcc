import type { Metadata } from "next";

import { CallToAction } from "@/components/organisms/call-to-action";
import { FeatureGrid } from "@/components/organisms/feature-grid";
import { PageHeader } from "@/components/templates/page-header";
import { cmmcPractices } from "@/lib/content/public-site";

export const metadata: Metadata = {
  title: "Training",
  description:
    "Explore CMMC Level 1 training for foundational cybersecurity practices and Federal Contract Information protection.",
};

export default function TrainingPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="CMMC Level 1 Training"
        description="Build foundational cybersecurity knowledge for protecting Federal Contract Information with practical, accessible training."
      />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <div>
          <h2 className="text-3xl font-semibold">What learners cover</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            The training introduces core practices, why they matter, and how
            teams can recognize evidence of implementation.
          </p>
        </div>
        <FeatureGrid features={cmmcPractices} columns="two" />
      </section>
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            "Foundational cybersecurity practices",
            "Protection of Federal Contract Information",
            "Evidence-aware readiness conversations",
          ].map((item) => (
            <article key={item} className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="font-semibold">{item}</h3>
            </article>
          ))}
        </div>
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Explore the training pathway"
          description="Pre-register your interest so the clinic can route you toward the next available training workflow."
          primaryHref="/request-access"
          primaryLabel="Request Access"
          secondaryHref="/resources"
          secondaryLabel="Preview Resources"
        />
      </div>
    </main>
  );
}
