import type { Database } from "@/types/database";

export type AccessRequest =
  Database["public"]["Tables"]["access_requests"]["Row"];

export const requestTypeOptions: Array<{
  value: AccessRequest["request_type"];
  label: string;
}> = [
  { value: "hands_on_lab", label: "Hands-on training lab" },
  { value: "student_resources", label: "Digital lab guides" },
  { value: "cmmc_level_1_training", label: "CMMC Level 1 training" },
];

export const experienceLevelOptions: Array<{
  value: AccessRequest["experience_level"];
  label: string;
}> = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "professional", label: "Professional" },
];

export const requestStatusOptions: Array<{
  value: AccessRequest["status"];
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "more_information_required", label: "More information required" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "withdrawn", label: "Withdrawn" },
];

export function formatAccessRequestValue(value: string) {
  return value.replaceAll("_", " ");
}
