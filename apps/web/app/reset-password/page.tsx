import type { Metadata } from "next";

import { TextField, SubmitButton } from "@/components/molecules/auth-fields";
import { AuthCard } from "@/components/templates/auth-card";
import { resetPasswordAction } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new DigitalRCC password.",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Choose a new password"
      description="Set a new password for the signed-in recovery session."
      searchParams={params}
    >
      <form action={resetPasswordAction} className="grid gap-4">
        <TextField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <TextField
          label="Confirm new password"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
        />
        <SubmitButton>Update password</SubmitButton>
      </form>
    </AuthCard>
  );
}
