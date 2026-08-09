import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unauthorized",
  description: "You do not have permission to access this DigitalRCC page.",
};

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold">Unauthorized</h1>
      <p className="text-muted-foreground">
        Your account does not currently have the role required to access this
        page.
      </p>
      <Link className="font-medium text-primary hover:underline" href="/dashboard">
        Return to dashboard
      </Link>
    </main>
  );
}
