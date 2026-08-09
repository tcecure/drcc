import type { Metadata } from "next";

import { CallToAction } from "@/components/organisms/call-to-action";
import { ResourceCard } from "@/components/molecules/resource-card";
import { PageHeader } from "@/components/templates/page-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Preview DigitalRCC resources including lab guides, course instructions, troubleshooting documents, CMMC references, templates, certification guidance, and career resources.",
};

export default async function ResourcesPage() {
  const supabase = await createClient();
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("status", "published")
    .eq("audience", "public")
    .is("required_role", null)
    .order("effective_date", { ascending: false });

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="Student Resources"
        description="A preview of support materials for training, lab practice, CMMC readiness, troubleshooting, certification, and careers."
      />
      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {(resources ?? []).map((resource) => (
          <ResourceCard key={resource.id} resource={resource} href={`/dashboard/resources/${resource.slug}`} />
        ))}
        {resources?.length === 0 ? (
          <p className="col-span-full rounded-lg border bg-card p-6 text-sm text-muted-foreground shadow-sm">
            Published public resources will appear here once an admin adds them.
          </p>
        ) : null}
      </section>
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CallToAction
          title="Need help finding the right resource?"
          description="Pre-register your interest and the clinic can route you toward training, lab guidance, or community support."
          primaryHref="/request-access"
          primaryLabel="Request Access"
          secondaryHref="/faq"
          secondaryLabel="Read FAQ"
        />
      </div>
    </main>
  );
}
