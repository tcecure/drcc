"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import {
  requireAnyRole,
  requireAuthenticatedUser,
  roleManagerRoles,
} from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { readPublicEnv } from "@/lib/validation/env";
import {
  accountStatusSchema,
  forgotPasswordSchema,
  loginSchema,
  profileUpdateSchema,
  resetPasswordSchema,
  roleAssignmentSchema,
  signupSchema,
} from "@/lib/validation/forms";

function formMessage(message: string) {
  return encodeURIComponent(message);
}

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    organization: formData.get("organization"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
    policyAccepted: formData.get("policyAccepted"),
  });

  if (!parsed.success) {
    redirect(`/signup?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid signup request.")}`);
  }

  const env = readPublicEnv();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
        organization: parsed.data.organization,
        phone: parsed.data.phone ?? "",
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${formMessage(error.message)}`);
  }

  redirect(
    `/login?message=${formMessage("Check your email to verify your account, then sign in.")}`,
  );
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") || "/dashboard",
  });

  if (!parsed.success) {
    redirect(`/login?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid login request.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(`/login?error=${formMessage(error.message)}`);
  }

  redirect(parsed.data.redirectTo || "/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirect(`/forgot-password?error=${formMessage("Use a valid email address.")}`);
  }

  const env = readPublicEnv();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${formMessage(error.message)}`);
  }

  redirect(
    `/forgot-password?message=${formMessage("Password reset instructions have been sent if the account exists.")}`,
  );
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });

  if (!parsed.success) {
    redirect(`/reset-password?error=${formMessage(parsed.error.issues[0]?.message ?? "Invalid password reset request.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    redirect(`/reset-password?error=${formMessage(error.message)}`);
  }

  redirect(`/login?message=${formMessage("Password updated. Sign in with your new password.")}`);
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireAuthenticatedUser();
  const parsed = profileUpdateSchema.safeParse({
    fullName: formData.get("fullName"),
    organization: formData.get("organization"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/profile?error=${formMessage("Profile update failed. Check required fields.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      organization: parsed.data.organization,
      phone: parsed.data.phone || null,
    })
    .eq("id", user.id);

  if (error) {
    redirect(`/dashboard/profile?error=${formMessage(error.message)}`);
  }

  revalidatePath("/dashboard/profile");
  redirect(`/dashboard/profile?message=${formMessage("Profile updated.")}`);
}

export async function assignRoleAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(roleManagerRoles);
  const parsed = roleAssignmentSchema.safeParse({
    userId: formData.get("userId"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success || parsed.data.userId === actor.id) {
    redirect(`/admin/users/${formData.get("userId")}/roles?error=${formMessage("Role assignment is not allowed.")}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("user_roles").insert({
    user_id: parsed.data.userId,
    role_id: parsed.data.roleId,
    assigned_by: actor.id,
  });

  if (error) {
    redirect(`/admin/users/${parsed.data.userId}/roles?error=${formMessage(error.message)}`);
  }

  await recordAuditEvent({
    actorId: actor.id,
    action: "role_assigned",
    entityType: "user_roles",
    entityId: parsed.data.userId,
    newValue: { role_id: parsed.data.roleId },
  });

  revalidatePath(`/admin/users/${parsed.data.userId}/roles`);
  redirect(`/admin/users/${parsed.data.userId}/roles?message=${formMessage("Role assigned.")}`);
}

export async function removeRoleAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(roleManagerRoles);
  const parsed = roleAssignmentSchema.safeParse({
    userId: formData.get("userId"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success || parsed.data.userId === actor.id) {
    redirect(`/admin/users/${formData.get("userId")}/roles?error=${formMessage("Role removal is not allowed.")}`);
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", parsed.data.userId)
    .eq("role_id", parsed.data.roleId);

  if (error) {
    redirect(`/admin/users/${parsed.data.userId}/roles?error=${formMessage(error.message)}`);
  }

  await recordAuditEvent({
    actorId: actor.id,
    action: "role_removed",
    entityType: "user_roles",
    entityId: parsed.data.userId,
    previousValue: { role_id: parsed.data.roleId },
  });

  revalidatePath(`/admin/users/${parsed.data.userId}/roles`);
  redirect(`/admin/users/${parsed.data.userId}/roles?message=${formMessage("Role removed.")}`);
}

export async function updateAccountStatusAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(roleManagerRoles);
  const parsed = accountStatusSchema.safeParse({
    userId: formData.get("userId"),
    accountStatus: formData.get("accountStatus"),
  });

  if (!parsed.success) {
    redirect(`/admin/users/${formData.get("userId")}/roles?error=${formMessage("Invalid account status.")}`);
  }

  const supabase = createAdminClient();
  const { data: previousProfile } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", parsed.data.userId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ account_status: parsed.data.accountStatus })
    .eq("id", parsed.data.userId);

  if (error) {
    redirect(`/admin/users/${parsed.data.userId}/roles?error=${formMessage(error.message)}`);
  }

  await recordAuditEvent({
    actorId: actor.id,
    action: "account_status_changed",
    entityType: "profiles",
    entityId: parsed.data.userId,
    previousValue: previousProfile
      ? { account_status: previousProfile.account_status }
      : null,
    newValue: { account_status: parsed.data.accountStatus },
  });

  revalidatePath(`/admin/users/${parsed.data.userId}/roles`);
  redirect(`/admin/users/${parsed.data.userId}/roles?message=${formMessage("Account status updated.")}`);
}
