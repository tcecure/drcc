"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { processEmailJob } from "@/lib/notifications/service";
import { renderEmailTemplate } from "@/lib/notifications/templates";
import {
  requireAnyRole,
  requireAuthenticatedUser,
  roleManagerRoles,
} from "@/lib/permissions/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignUserToNextCohort } from "@/lib/students/cohorts";
import { readServerEnv } from "@/lib/validation/env";
import type { Json } from "@/types/database";

type StudentImportRow = {
  fullName: string;
  email: string;
};

type StudentImportResult = {
  invited: number;
  updated: number;
  scheduled: number;
  failed: Array<{ email: string; reason: string }>;
};

function formMessage(message: string) {
  return encodeURIComponent(message);
}

export async function importStudentsCsvAction(formData: FormData) {
  const actor = await requireAuthenticatedUser();
  await requireAnyRole(roleManagerRoles);

  const file = formData.get("csvFile");

  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/students/import?error=${formMessage("Upload a CSV file with name and email columns.")}`);
  }

  if (file.size > 1024 * 1024) {
    redirect(`/admin/students/import?error=${formMessage("CSV file must be 1 MB or smaller.")}`);
  }

  let rows: StudentImportRow[];

  try {
    rows = parseStudentCsv(await file.text());
  } catch (error) {
    redirect(
      `/admin/students/import?error=${formMessage(error instanceof Error ? error.message : "CSV could not be parsed.")}`,
    );
  }

  if (rows.length === 0) {
    redirect(`/admin/students/import?error=${formMessage("No valid student rows found in the CSV.")}`);
  }

  const result = await importStudentRows(rows, actor.id);
  const summary = [
    `${result.invited} invited`,
    `${result.updated} updated`,
    `${result.scheduled} scheduled`,
    result.failed.length ? `${result.failed.length} failed` : null,
  ]
    .filter(Boolean)
    .join(", ");

  await recordAuditEvent({
    actorId: actor.id,
    action: "student_csv_imported",
    entityType: "student_imports",
    previousValue: null,
    newValue: {
      uploaded_rows: rows.length,
      invited: result.invited,
      updated: result.updated,
      scheduled: result.scheduled,
      failed: result.failed,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/email-jobs");
  revalidatePath("/admin/students/import");
  redirect(`/admin/students/import?message=${formMessage(`Student import complete: ${summary}.`)}`);
}

async function importStudentRows(rows: StudentImportRow[], actorId: string): Promise<StudentImportResult> {
  const env = readServerEnv();
  const supabase = createAdminClient();
  const result: StudentImportResult = { invited: 0, updated: 0, scheduled: 0, failed: [] };
  const { data: studentRole } = await supabase
    .from("roles")
    .select("id")
    .eq("role_name", "student")
    .single();

  if (!studentRole) {
    throw new Error("Student role is missing.");
  }

  for (const row of rows) {
    try {
      const existing = await findExistingProfile(row.email);
      let userId = existing?.id ?? null;
      let invited = false;

      if (!userId) {
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(row.email, {
          data: {
            full_name: row.fullName,
            organization: "DigitalRCC Student",
          },
          redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        });

        if (error) {
          throw new Error(error.message);
        }

        userId = data.user?.id ?? null;
        invited = true;
      }

      if (!userId) {
        throw new Error("Supabase did not return a user id.");
      }

      await supabase.from("profiles").upsert({
        id: userId,
        email: row.email,
        full_name: row.fullName,
        organization: existing?.organization || "DigitalRCC Student",
        account_status: "active",
      });

      await supabase.from("user_roles").upsert({
        user_id: userId,
        role_id: studentRole.id,
        assigned_by: actorId,
      }, {
        onConflict: "user_id,role_id",
      });

      await queueStudentPortalEmail({
        userId,
        email: row.email,
        fullName: row.fullName,
        actorId,
        appUrl: env.NEXT_PUBLIC_APP_URL,
      });

      const cohort = await assignUserToNextCohort({ userId, actorId });

      if (cohort.created) {
        result.scheduled += 1;
      }

      if (invited) {
        result.invited += 1;
      } else {
        result.updated += 1;
      }
    } catch (error) {
      result.failed.push({
        email: row.email,
        reason: error instanceof Error ? error.message : "Unknown import error.",
      });
    }
  }

  return result;
}

async function findExistingProfile(email: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, organization")
    .ilike("email", email)
    .maybeSingle();

  return data;
}

async function queueStudentPortalEmail({
  userId,
  email,
  fullName,
  actorId,
  appUrl,
}: {
  userId: string;
  email: string;
  fullName: string;
  actorId: string;
  appUrl: string;
}) {
  const supabase = createAdminClient();
  const actionUrl = `${appUrl}/dashboard/labs`;
  const rendered = renderEmailTemplate("student_portal_invitation", {
    actionUrl,
    notes: `Student: ${fullName}. Portal: ${appUrl}. Lab tools: ${actionUrl}.`,
  });
  const { data: job } = await supabase
    .from("email_jobs")
    .insert({
      user_id: userId,
      template_name: "student_portal_invitation",
      recipient: email,
      subject: rendered.subject,
      payload: {
        actionUrl,
        appUrl,
        fullName,
      } satisfies Json,
      rendered_text: rendered.text,
      rendered_html: rendered.html,
      status: "queued",
    })
    .select("id")
    .single();

  await supabase.from("notifications").insert({
    user_id: userId,
    notification_type: "student_portal_invitation",
    title: "DigitalRCC student access",
    message: "Your student access is ready. Open the lab dashboard for guides, tools, queue status, and progress tracking.",
    action_url: actionUrl,
  });

  await recordAuditEvent({
    actorId,
    action: "student_portal_invitation_queued",
    entityType: "email_jobs",
    entityId: job?.id ?? null,
    previousValue: null,
    newValue: { user_id: userId, recipient: email, action_url: actionUrl },
  });

  if (job?.id) {
    await processEmailJob(job.id);
  }
}

function parseStudentCsv(input: string): StudentImportRow[] {
  const lines = parseCsv(input);

  if (lines.length === 0) {
    return [];
  }

  const firstRow = lines[0].map(normalizeHeader);
  const hasHeader = firstRow.includes("email") && (
    firstRow.some((header) => ["name", "full_name", "user_name"].includes(header)) ||
    (firstRow.includes("first_name") && firstRow.includes("last_name"))
  );
  const emailIndex = hasHeader ? firstRow.indexOf("email") : 1;
  const nameIndex = hasHeader
    ? firstRow.findIndex((header) => ["name", "full_name", "user_name"].includes(header))
    : 0;
  const firstNameIndex = hasHeader ? firstRow.indexOf("first_name") : -1;
  const lastNameIndex = hasHeader ? firstRow.indexOf("last_name") : -1;
  const bookingStatusIndex = hasHeader ? firstRow.indexOf("booking_status") : -1;
  const dataRows = hasHeader ? lines.slice(1) : lines;
  const rows = dataRows
    .filter((line) => {
      if (bookingStatusIndex < 0) {
        return true;
      }

      return String(line[bookingStatusIndex] ?? "").trim().toLowerCase() === "confirmed";
    })
    .map((line) => {
      const fullName = nameIndex >= 0
        ? String(line[nameIndex] ?? "").trim()
        : [line[firstNameIndex], line[lastNameIndex]]
            .map((value) => String(value ?? "").trim())
            .filter(Boolean)
            .join(" ");

      return {
        fullName,
        email: String(line[emailIndex] ?? "").trim().toLowerCase(),
      };
    })
    .filter((row) => row.fullName || row.email);

  const seen = new Set<string>();
  const valid: StudentImportRow[] = [];

  for (const [index, row] of rows.entries()) {
    if (!row.fullName || !row.email) {
      throw new Error(`Row ${index + 1} is missing a name or email.`);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      throw new Error(`Row ${index + 1} has an invalid email address.`);
    }

    if (seen.has(row.email)) {
      continue;
    }

    seen.add(row.email);
    valid.push(row);
  }

  return valid;
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }

      row.push(current);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_");
}
