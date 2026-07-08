import type { Metadata } from "next";

import { TextField, SubmitButton } from "@/components/molecules/auth-fields";
import { DashboardNav } from "@/components/organisms/dashboard-nav";
import { updateProfileAction } from "@/lib/auth/actions";
import {
  getCurrentProfile,
  getUserRoles,
  requireAuthenticatedUser,
} from "@/lib/permissions/roles";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your DigitalRCC profile.",
};

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  await requireAuthenticatedUser();
  const [params, profile, roles] = await Promise.all([
    searchParams,
    getCurrentProfile(),
    getUserRoles(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <DashboardNav roles={roles} />
      <section className="max-w-2xl">
        <h1 className="text-4xl font-semibold">Profile</h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Keep your contact and organization information current.
        </p>
      </section>
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
      <form action={updateProfileAction} className="grid max-w-xl gap-4 rounded-lg border bg-card p-6 shadow-sm">
        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          defaultValue={profile?.full_name ?? ""}
        />
        <TextField
          label="Organization or school"
          name="organization"
          autoComplete="organization"
          defaultValue={profile?.organization ?? ""}
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required={false}
          defaultValue={profile?.phone ?? ""}
        />
        <SubmitButton>Update profile</SubmitButton>
      </form>
    </main>
  );
}
