import type { Metadata } from "next";
import Link from "next/link";

import { TextField, SubmitButton } from "@/components/molecules/auth-fields";
import { AuthCard } from "@/components/templates/auth-card";
import { forgotPasswordAction } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a DigitalRCC password reset email.",
};

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Reset your password"
      description="Enter your account email and we will send reset instructions if the account exists."
      searchParams={params}
      footer={
        <Link className="text-primary hover:underline" href="/login">
          Back to login
        </Link>
      }
    >
      <form action={forgotPasswordAction} className="grid gap-4">
        <TextField label="Email" name="email" type="email" autoComplete="email" />
        <SubmitButton>Send reset instructions</SubmitButton>
      </form>
    </AuthCard>
  );
}
