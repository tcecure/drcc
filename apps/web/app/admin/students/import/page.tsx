import Link from "next/link";

import { DashboardNav } from "@/components/organisms/dashboard-nav";
import {
  getUserRoles,
  requireAnyRole,
  roleManagerRoles,
} from "@/lib/permissions/roles";
import {
  importStudentsCsvAction,
  importStudentsManualAction,
} from "@/lib/students/import-actions";

type ImportStudentsPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function ImportStudentsPage({
  searchParams,
}: ImportStudentsPageProps) {
  await requireAnyRole(roleManagerRoles);
  const [roles, params] = await Promise.all([getUserRoles(), searchParams]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-4xl font-semibold">Import students</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Upload a CSV to invite students, assign student access, and send the
            lab companion dashboard link.
          </p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
          href="/admin/email-jobs"
        >
          Email jobs
        </Link>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
          href="/admin/students/queue"
        >
          Student queue
        </Link>
      </section>
      {params.error ? <Message tone="error" message={params.error} /> : null}
      {params.message ? (
        <Message tone="success" message={params.message} />
      ) : null}
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">CSV format</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Upload the participant export directly, or use a simple CSV with
            name and email columns. Duplicate emails in the same file are
            skipped.
          </p>
          <pre className="mt-4 overflow-auto rounded-md border bg-background p-3 text-xs leading-5 text-muted-foreground">
            {`First Name,Last Name,Email,Booking Status
Eddie,Barlow,eddie@example.com,Confirmed

name,email
Eddie Barlow,eddie@example.com
Jane Student,jane@example.edu`}
          </pre>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-muted-foreground">
            <li>
              Participant exports use First Name, Last Name, Email, and Booking
              Status.
            </li>
            <li>
              Only confirmed bookings are imported when Booking Status is
              present.
            </li>
            <li>
              New students receive a Supabase invite email to finish account
              setup.
            </li>
            <li>
              Existing students are updated and resent portal information.
            </li>
            <li>
              Every row is assigned the student role, activated, and placed into
              the cohort queue.
            </li>
          </ul>
        </aside>
        <form
          action={importStudentsCsvAction}
          className="rounded-lg border bg-card p-6 shadow-sm"
        >
          <div className="grid gap-5">
            <div>
              <h2 className="text-xl font-semibold">Upload CSV</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Best for participant exports or larger batches.
              </p>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              Student CSV
              <input
                className="rounded-md border bg-background px-3 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                name="csvFile"
                type="file"
                accept=".csv,text/csv"
                required
              />
            </label>
            <button
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              type="submit"
            >
              Import and invite students
            </button>
          </div>
        </form>
      </section>
      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-xl font-semibold">Add students manually</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Add up to 10 students without a CSV. Empty rows are ignored, and
              duplicates in this form are skipped.
            </p>
          </div>
        </div>
        <form action={importStudentsManualAction} className="mt-5 grid gap-5">
          <div className="grid gap-3">
            <div className="hidden grid-cols-[3rem_1fr_1fr] gap-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <span>#</span>
              <span>Name</span>
              <span>Email</span>
            </div>
            {Array.from({ length: 10 }, (_, index) => (
              <div
                className="grid gap-2 sm:grid-cols-[3rem_1fr_1fr] sm:items-center sm:gap-3"
                key={index}
              >
                <span className="text-sm font-medium text-muted-foreground">
                  #{index + 1}
                </span>
                <label className="grid gap-1 text-sm font-medium sm:contents">
                  <span className="sr-only">Student {index + 1} name</span>
                  <input
                    className="h-11 rounded-md border bg-background px-3 text-sm"
                    name={`studentName-${index}`}
                    placeholder="Full name"
                    type="text"
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium sm:contents">
                  <span className="sr-only">Student {index + 1} email</span>
                  <input
                    className="h-11 rounded-md border bg-background px-3 text-sm"
                    name={`studentEmail-${index}`}
                    placeholder="student@example.edu"
                    type="email"
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Submitting sends invites for new users and places each student
              into the next available cohort seat.
            </p>
            <button
              className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              type="submit"
            >
              Add and invite students
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Message({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  const className =
    tone === "error"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : "border-primary/30 bg-primary/10 text-primary";

  return (
    <p className={`rounded-md border p-3 text-sm ${className}`}>{message}</p>
  );
}
