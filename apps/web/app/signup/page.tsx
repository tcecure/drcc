import type { Metadata } from "next";
import Link from "next/link";

import { TextField, SubmitButton } from "@/components/molecules/auth-fields";
import { AuthCard } from "@/components/templates/auth-card";
import { signupAction } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a DigitalRCC student account.",
};

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Create your account"
      description="Register as a student. Email verification is required before portal access."
      searchParams={params}
      footer={
        <Link className="text-primary hover:underline" href="/login">
          Already have an account? Log in
        </Link>
      }
    >
      <form action={signupAction} className="grid gap-4">
        <TextField label="Full name" name="fullName" autoComplete="name" />
        <TextField label="Email" name="email" type="email" autoComplete="email" />
        <TextField
          label="Organization or school"
          name="organization"
          autoComplete="organization"
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required={false}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <TextField
          label="Confirm password"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
        />
        <label className="flex gap-3 text-sm text-muted-foreground">
          <input
            className="mt-1 size-4"
            type="checkbox"
            name="policyAccepted"
            required
          />
          <span>
            I understand that DigitalRCC access is role-based and that protected
            infrastructure and admin access require approval.
          </span>
        </label>
        <SubmitButton>Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
