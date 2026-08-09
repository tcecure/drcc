import type { Database } from "@/types/database";

export type Resource = Database["public"]["Tables"]["resources"]["Row"];
export type ResourceRole = NonNullable<Resource["required_role"]>;

export const resourceTypeOptions: Array<{
  value: Resource["resource_type"];
  label: string;
}> = [
  { value: "student_guide", label: "Student guide" },
  { value: "lab_guide", label: "Lab guide" },
  { value: "video", label: "Video" },
  { value: "policy", label: "Policy" },
  { value: "checklist", label: "Checklist" },
  { value: "faq", label: "FAQ" },
  { value: "troubleshooting", label: "Troubleshooting" },
  { value: "cmmc_reference", label: "CMMC reference" },
  { value: "template", label: "Template" },
  { value: "instructor_resource", label: "Instructor resource" },
  { value: "customer_delivery_resource", label: "Customer delivery resource" },
  { value: "announcement", label: "Announcement" },
];

export const resourceAudienceOptions: Array<{
  value: Resource["audience"];
  label: string;
}> = [
  { value: "public", label: "Public" },
  { value: "student", label: "Students" },
  { value: "approver", label: "Approvers" },
  { value: "admin", label: "Admins" },
];

export const resourceStatusOptions: Array<{
  value: Resource["status"];
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In review" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const requiredRoleOptions: Array<{
  value: ResourceRole | "none";
  label: string;
}> = [
  { value: "none", label: "No role required" },
  { value: "student", label: "Student" },
  { value: "approver", label: "Approver" },
  { value: "admin", label: "Admin" },
];

export function formatResourceValue(value: string) {
  return value.replaceAll("_", " ");
}

export function isReviewDue(resource: Resource) {
  if (!resource.review_due_at) {
    return false;
  }

  return new Date(resource.review_due_at).getTime() <= Date.now();
}
