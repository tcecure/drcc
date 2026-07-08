import { redirect } from "next/navigation";

type LegacyAdminAccessRequestDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegacyAdminAccessRequestDetailPage({
  params,
}: LegacyAdminAccessRequestDetailPageProps) {
  const { id } = await params;

  redirect(`/dashboard/approvals/${id}`);
}
