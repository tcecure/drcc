import "server-only";

import type { Json } from "@/types/database";

export type EmailTemplateName =
  | "account_registered"
  | "access_request_submitted"
  | "more_information_required"
  | "request_approved"
  | "request_denied"
  | "moodle_enrollment_ready"
  | "moodle_course_completed"
  | "hands_on_eligibility_unlocked"
  | "lab_request_submitted"
  | "readiness_confirmation_requested"
  | "reservation_offered"
  | "reservation_expiring"
  | "lab_access_provisioned"
  | "lab_access_expiring"
  | "lab_completed"
  | "lab_access_revoked"
  | "support_request_updated";

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

type TemplateContext = Record<string, Json | undefined>;

const templateCopy: Record<EmailTemplateName, { subject: string; title: string; message: string }> = {
  account_registered: {
    subject: "Your DigitalRCC account was created",
    title: "Account registered",
    message: "Your DigitalRCC account has been created. Verify your email, then sign in to continue.",
  },
  access_request_submitted: {
    subject: "DigitalRCC access request submitted",
    title: "Access request submitted",
    message: "Your access request was submitted and is waiting for review.",
  },
  more_information_required: {
    subject: "More information needed for your DigitalRCC request",
    title: "More information requested",
    message: "An approver needs more information before deciding on your access request.",
  },
  request_approved: {
    subject: "DigitalRCC access request approved",
    title: "Access request approved",
    message: "Your DigitalRCC access request has been approved.",
  },
  request_denied: {
    subject: "DigitalRCC access request update",
    title: "Access request denied",
    message: "Your DigitalRCC access request was denied.",
  },
  moodle_enrollment_ready: {
    subject: "DigitalRCC training enrollment is ready",
    title: "Training enrollment ready",
    message: "Your required Moodle training enrollment is ready.",
  },
  moodle_course_completed: {
    subject: "DigitalRCC training complete",
    title: "Training complete",
    message: "Your required training is complete. You are eligible to request hands-on lab access.",
  },
  hands_on_eligibility_unlocked: {
    subject: "Hands-on lab eligibility unlocked",
    title: "Hands-on eligibility unlocked",
    message: "You can now request hands-on cyber range lab access.",
  },
  lab_request_submitted: {
    subject: "DigitalRCC lab request submitted",
    title: "Lab request submitted",
    message: "Your hands-on lab request was submitted and added to the waitlist.",
  },
  readiness_confirmation_requested: {
    subject: "Confirm your DigitalRCC lab readiness",
    title: "Readiness confirmation requested",
    message: "Please confirm your readiness so an approver can continue your lab reservation.",
  },
  reservation_offered: {
    subject: "DigitalRCC lab reservation offered",
    title: "Lab reservation offered",
    message: "A hands-on lab slot is available. Confirm or decline the reservation from your labs dashboard.",
  },
  reservation_expiring: {
    subject: "DigitalRCC lab reservation expiring soon",
    title: "Reservation expiring",
    message: "Your lab reservation offer is expiring soon. Confirm it if you still want the slot.",
  },
  lab_access_provisioned: {
    subject: "DigitalRCC lab access provisioned",
    title: "Lab access provisioned",
    message: "Your lab access has been provisioned. Review your current lab details in the portal.",
  },
  lab_access_expiring: {
    subject: "DigitalRCC lab access expiring soon",
    title: "Lab access expiring",
    message: "Your active lab access is nearing expiration.",
  },
  lab_completed: {
    subject: "DigitalRCC lab completed",
    title: "Lab completed",
    message: "Your hands-on lab has been marked complete.",
  },
  lab_access_revoked: {
    subject: "DigitalRCC lab access update",
    title: "Lab access revoked",
    message: "Your lab access has been revoked or released.",
  },
  support_request_updated: {
    subject: "DigitalRCC support request updated",
    title: "Support request updated",
    message: "A support request associated with your DigitalRCC account was updated.",
  },
};

export function getTemplateCopy(templateName: EmailTemplateName) {
  return templateCopy[templateName];
}

export function renderEmailTemplate(templateName: EmailTemplateName, context: TemplateContext = {}): RenderedEmail {
  const copy = getTemplateCopy(templateName);
  const actionUrl = typeof context.actionUrl === "string" ? context.actionUrl : null;
  const notes = typeof context.notes === "string" && context.notes.trim() ? context.notes.trim() : null;
  const message = notes ? `${copy.message} Note: ${notes}` : copy.message;
  const cta = actionUrl ? `\n\nOpen in DigitalRCC: ${actionUrl}` : "";
  const text = `${copy.title}\n\n${message}${cta}`;
  const html = [
    "<!doctype html>",
    '<html lang="en">',
    "<body>",
    `<h1>${escapeHtml(copy.title)}</h1>`,
    `<p>${escapeHtml(message)}</p>`,
    actionUrl ? `<p><a href="${escapeHtml(actionUrl)}">Open in DigitalRCC</a></p>` : "",
    "</body>",
    "</html>",
  ].join("");

  return {
    subject: copy.subject,
    text,
    html,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
