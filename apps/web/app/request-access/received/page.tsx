import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Request Received",
  description: "DigitalRCC pre-registration interest received.",
};

export default function RequestAccessReceivedPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="rounded-lg border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-primary">Request received</p>
        <h1 className="mt-3 text-4xl font-semibold">
          We have received your request.
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Thank you for sharing your DigitalRCC interest. The clinic team will
          review your submission and follow up using the contact email provided.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            href="/"
          >
            Back to home
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            href="/signup"
          >
            Create a portal account
          </Link>
        </div>
      </section>
    </main>
  );
}
