import { z } from "zod";

export const requestAccessSchema = z.object({
  name: z.string().trim().min(2, "Full name is required."),
  email: z.string().trim().email("Use a valid email address."),
  organization: z.string().trim().min(2, "Organization or school is required."),
  interest: z.enum([
    "cmmc_level_1_training",
    "hands_on_lab",
    "student_resources",
    "customer_delivery_zone",
  ]),
  message: z.string().trim().min(20, "Share at least 20 characters about your interest."),
});

export type RequestAccessInput = z.infer<typeof requestAccessSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required."),
    email: z.string().trim().email("Use a valid email address."),
    organization: z.string().trim().min(2, "Organization or school is required."),
    phone: z.string().trim().optional(),
    password: z.string().min(8, "Password must be at least 8 characters."),
    passwordConfirmation: z.string().min(8),
    policyAccepted: z.literal("on", {
      error: "You must accept the portal policy.",
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords must match.",
    path: ["passwordConfirmation"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Use a valid email address."),
  password: z.string().min(1, "Password is required."),
  redirectTo: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Use a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    passwordConfirmation: z.string().min(8),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords must match.",
    path: ["passwordConfirmation"],
  });

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2),
  organization: z.string().trim().min(2),
  phone: z.string().trim().optional(),
});

export const roleAssignmentSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
});

export const accountStatusSchema = z.object({
  userId: z.string().uuid(),
  accountStatus: z.enum(["pending", "active", "suspended", "disabled"]),
});

export const accessRequestFormSchema = z.object({
  requestId: z.string().uuid().optional(),
  requestType: z.enum([
    "cmmc_level_1_training",
    "hands_on_lab",
    "instructor_access",
    "customer_delivery_zone",
    "administrative_access",
  ]),
  requestedProgram: z.string().trim().min(2, "Requested program is required."),
  reason: z.string().trim().min(20, "Share at least 20 characters about why you need access."),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced", "professional"]),
  schoolOrOrganization: z.string().trim().min(2, "School or organization is required."),
  availabilityNotes: z.string().trim().optional(),
  intent: z.enum(["draft", "submit"]),
});

export const accessRequestDecisionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum([
    "assign_reviewer",
    "under_review",
    "more_information_required",
    "approved",
    "denied",
  ]),
  decisionNotes: z.string().trim().optional(),
  internalNotes: z.string().trim().optional(),
});

export const accessRequestWithdrawSchema = z.object({
  requestId: z.string().uuid(),
});

export const labRequestFormSchema = z.object({
  labTrackId: z.string().uuid(),
  preferredStartDate: z.string().trim().optional(),
  weeklyAvailability: z.string().trim().min(10, "Share your weekly availability."),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced", "professional"]),
  accessibilityNeeds: z.string().trim().optional(),
  acceptableUseAccepted: z.literal("on", {
    error: "You must accept the acceptable use policy.",
  }),
  connectivityConfirmed: z.literal("on", {
    error: "You must confirm connectivity readiness.",
  }),
});

export const labQueueStatusUpdateSchema = z.object({
  queueEntryId: z.string().uuid(),
  queueStatus: z.enum([
    "waiting",
    "readiness_requested",
    "ready",
    "reservation_offered",
    "reserved",
    "provisioning",
    "active",
    "paused",
    "removed",
    "completed",
  ]),
  reason: z.string().trim().optional(),
});

export const labQueuePrioritySchema = z.object({
  queueEntryId: z.string().uuid(),
  priorityGroup: z.coerce.number().int().min(1).max(999),
  manualPriority: z.coerce.number().int().min(-100).max(100),
  reason: z.string().trim().min(8, "Priority changes require a reason."),
});

export const labReservationOfferSchema = z.object({
  queueEntryId: z.string().uuid(),
});

export const labAssignmentActionSchema = z.object({
  assignmentId: z.string().uuid(),
});

export const labVerificationRequestSchema = z.object({
  assignmentId: z.string().uuid(),
  verificationType: z.enum(["check_progress", "verify_lab"]),
});

export const supportRequestSchema = z.object({
  labAssignmentId: z.string().uuid().optional(),
  category: z.enum(["connectivity", "guacamole", "vpn", "lab_guide", "verification", "other"]),
  subject: z.string().trim().min(6, "Subject is required."),
  description: z.string().trim().min(20, "Share at least 20 characters about the issue."),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});

export const supportStatusSchema = z.object({
  supportRequestId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "waiting_on_student", "resolved", "closed"]),
});

export const labCapacitySettingsSchema = z.object({
  capacitySettingsId: z.string().uuid(),
  maximumActive: z.coerce.number().int().min(1).max(500),
  maximumReserved: z.coerce.number().int().min(0).max(100),
  confirmationWindowHours: z.coerce.number().int().min(1).max(720),
  inactivityWarningHours: z.coerce.number().int().min(1).max(720),
  standardDurationDays: z.coerce.number().int().min(1).max(90),
  maximumExtensionDays: z.coerce.number().int().min(0).max(90),
  automaticExpirationEnabled: z.enum(["on"]).optional(),
});

export const resourceEditorSchema = z
  .object({
    resourceId: z.string().uuid().optional(),
    title: z.string().trim().min(3, "Title is required."),
    slug: z
      .string()
      .trim()
      .min(3, "Slug is required.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
    description: z.string().trim().min(12, "Description is required."),
    resourceType: z.enum([
      "student_guide",
      "lab_guide",
      "video",
      "policy",
      "checklist",
      "faq",
      "troubleshooting",
      "cmmc_reference",
      "template",
      "instructor_resource",
      "customer_delivery_resource",
      "announcement",
    ]),
    programArea: z.string().trim().min(2, "Program area is required."),
    audience: z.enum(["public", "student", "approver", "admin"]),
    requiredRole: z.enum(["student", "approver", "admin", "none"]),
    filePath: z.string().trim().optional(),
    externalUrl: z.string().trim().url("Use a valid URL.").optional().or(z.literal("")),
    version: z.string().trim().min(1, "Version is required."),
    status: z.enum(["draft", "in_review", "published", "archived"]),
    effectiveDate: z.string().trim().optional(),
    expirationDate: z.string().trim().optional(),
    reviewDueAt: z.string().trim().optional(),
    tags: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.filePath || data.externalUrl), {
    message: "Add either a file path or an external URL.",
    path: ["externalUrl"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AccessRequestFormInput = z.infer<typeof accessRequestFormSchema>;
export type AccessRequestDecisionInput = z.infer<typeof accessRequestDecisionSchema>;
export type LabRequestFormInput = z.infer<typeof labRequestFormSchema>;
export type LabCapacitySettingsInput = z.infer<typeof labCapacitySettingsSchema>;
export type LabVerificationRequestInput = z.infer<typeof labVerificationRequestSchema>;
export type SupportRequestInput = z.infer<typeof supportRequestSchema>;
export type ResourceEditorInput = z.infer<typeof resourceEditorSchema>;
