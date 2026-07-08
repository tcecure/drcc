import "server-only";

import { recordAuditEvent } from "@/lib/audit/audit-log";
import { sendSesEmail } from "@/lib/notifications/ses";
import { getTemplateCopy, renderEmailTemplate, type EmailTemplateName } from "@/lib/notifications/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { readServerEnv } from "@/lib/validation/env";
import type { Json } from "@/types/database";

type NotifyUserInput = {
  userId: string;
  templateName: EmailTemplateName;
  actionUrl?: string | null;
  payload?: Record<string, Json | undefined>;
  audit?: {
    actorId: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    previousValue?: Json | null;
    newValue?: Json | null;
  };
};

export async function notifyUser(input: NotifyUserInput) {
  const supabase = createAdminClient();
  const copy = getTemplateCopy(input.templateName);
  const actionUrl = input.actionUrl ?? null;
  const context = {
    ...(input.payload ?? {}),
    actionUrl,
  };
  const rendered = renderEmailTemplate(input.templateName, context);

  await supabase.from("notifications").insert({
    user_id: input.userId,
    notification_type: input.templateName,
    title: copy.title,
    message: rendered.text.split("\n\n")[1] ?? copy.message,
    action_url: actionUrl,
  });

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", input.userId)
    .single();

  if (profile?.email) {
    await supabase.from("email_jobs").insert({
      user_id: input.userId,
      template_name: input.templateName,
      recipient: profile.email,
      subject: rendered.subject,
      payload: sanitizePayload(context),
      rendered_text: rendered.text,
      rendered_html: rendered.html,
      status: "queued",
    });
  }

  if (input.audit) {
    await recordAuditEvent(input.audit);
  }
}

export async function processEmailJob(jobId: string) {
  const env = readServerEnv();
  const supabase = createAdminClient();
  const { data: job } = await supabase
    .from("email_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job || !["queued", "failed"].includes(job.status)) {
    return { ok: false, message: "Email job is not queued or failed." };
  }

  await supabase
    .from("email_jobs")
    .update({
      status: "sending",
      attempts: job.attempts + 1,
      error_message: null,
    })
    .eq("id", job.id);

  if (env.EMAIL_DELIVERY_MODE === "mock") {
    await supabase
      .from("email_jobs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (job.user_id) {
      await supabase
        .from("notifications")
        .update({ sent_email_at: new Date().toISOString() })
        .eq("user_id", job.user_id)
        .eq("notification_type", job.template_name)
        .is("sent_email_at", null);
    }

    return { ok: true, message: "Mock email marked sent." };
  }

  try {
    await sendSesEmail(env, {
      to: job.recipient,
      subject: job.subject,
      text: job.rendered_text ?? job.subject,
      html: job.rendered_html ?? `<p>${job.subject}</p>`,
    });
    await supabase
      .from("email_jobs")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return { ok: true, message: "Email sent." };
  } catch (error) {
    await supabase
      .from("email_jobs")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown email delivery error.",
      })
      .eq("id", job.id);

    return { ok: false, message: "Email delivery failed." };
  }
}

function sanitizePayload(payload: Record<string, Json | undefined>) {
  const blocked = ["password", "secret", "token", "credential"];
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (value === undefined) {
        return false;
      }

      return !blocked.some((blockedKey) => key.toLowerCase().includes(blockedKey));
    }),
  ) as Json;
}
