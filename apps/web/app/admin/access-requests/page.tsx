import { redirect } from "next/navigation";

export default function LegacyAdminAccessRequestsPage() {
  redirect("/dashboard/approvals");
}
