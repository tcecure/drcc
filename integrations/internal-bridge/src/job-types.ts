import { z } from "zod";

export const provisioningJobTypes = [
  "create_student_account",
  "enable_student_account",
  "assign_student_to_pod",
  "provision_guacamole_access",
  "provision_vpn_access",
  "seed_lab",
  "verify_lab",
  "disable_student_access",
  "reset_lab",
  "release_pod",
  "reset_student_password",
] as const;

export const provisioningJobTypeSchema = z.enum(provisioningJobTypes);

export type ProvisioningJobType = (typeof provisioningJobTypes)[number];

export const payloadSchema = z.object({
  assignmentId: z.string().uuid(),
  labInstanceId: z.string().uuid(),
  labTrackId: z.string().uuid().nullable(),
  podName: z.string().nullable(),
  environmentIdentifier: z.string().nullable(),
});

export function validateJobPayload(jobType: string, payload: unknown) {
  return {
    jobType: provisioningJobTypeSchema.parse(jobType),
    payload: payloadSchema.parse(payload),
  };
}
