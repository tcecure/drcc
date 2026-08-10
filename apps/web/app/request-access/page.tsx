import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/templates/page-header";
import { submitPreRegistrationInterestAction } from "@/lib/access/actions";

export const metadata: Metadata = {
  title: "Request Access",
  description:
    "Submit a DigitalRCC lab companion access request for student training labs.",
};

const interests = [
  { label: "CMMC Level 1 training", value: "cmmc_level_1_training" },
  { label: "Training labs - Coming soon", value: "hands_on_lab" },
  { label: "Digital lab guides - Coming soon", value: "student_resources" },
];

type RequestAccessPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function RequestAccessPage({
  searchParams,
}: RequestAccessPageProps) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="Request Access"
        description="Request student access to the DigitalRCC lab companion. Approved students are queued for a 14-day hands-on training lab window."
      />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <aside className="rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Before you submit</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            You do not need an account to send the first request. After review,
            an approver will help move you into the student queue.
          </p>
          <ul className="mt-5 flex flex-col gap-3 text-sm text-muted-foreground">
            <li>Use your best contact email.</li>
            <li>Select the lab need closest to your request.</li>
            <li>Do not include passwords, private keys, or sensitive data.</li>
          </ul>
        </aside>
        <form
          action={submitPreRegistrationInterestAction}
          className="rounded-lg border bg-card p-6 shadow-sm"
          aria-label="Pre-registration request form"
        >
          <div className="grid gap-5">
            {params.error ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {params.error}
              </p>
            ) : null}
            {params.message ? (
              <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
                {params.message}
              </p>
            ) : null}
            <label className="grid gap-2 text-sm font-medium">
              Full name
              <input
                className="h-11 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Student"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Email
              <input
                className="h-11 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="jane@example.edu"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Organization or school
              <input
                className="h-11 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                name="organization"
                type="text"
                autoComplete="organization"
                placeholder="Community College or Organization"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Area of interest
              <select
                className="h-11 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                name="interest"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Select an option
                </option>
                {interests.map((interest) => (
                  <option key={interest.value} value={interest.value}>
                    {interest.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              What are you hoping to do?
              <textarea
                className="min-h-32 rounded-md border bg-background px-3 py-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                name="message"
                placeholder="Share a brief note about your training goal, lab readiness, or guide needs."
                required
              />
            </label>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Submit access request
            </button>
            <p className="text-xs leading-5 text-muted-foreground">
              Already have an account?{" "}
              <Link className="font-medium text-primary hover:underline" href="/dashboard/access">
                Submit a formal access request
              </Link>
              .
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
