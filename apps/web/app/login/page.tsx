import type { Metadata } from "next";
import Link from "next/link";

import { TextField, SubmitButton } from "@/components/molecules/auth-fields";
import { AuthCard } from "@/components/templates/auth-card";
import { loginAction } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to the DigitalRCC portal.",
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    redirectTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Log in"
      description="Access your DigitalRCC dashboard, profile, and role-aware portal tools."
      searchParams={params}
      footer={
        <div className="flex flex-col gap-2">
          <Link className="text-primary hover:underline" href="/signup">
            Need an account? Sign up
          </Link>
          <Link className="text-primary hover:underline" href="/forgot-password">
            Forgot your password?
          </Link>
        </div>
      }
    >
      <form action={loginAction} className="grid gap-4">
        <input type="hidden" name="redirectTo" value={params.redirectTo ?? "/dashboard"} />
        <TextField label="Email" name="email" type="email" autoComplete="email" />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <SubmitButton>Log in</SubmitButton>
      </form>
    </AuthCard>
  );
}
