import { StaffShell } from "../StaffShell";
import { AdvisersTab, type StaffSearchParams } from "../StaffTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Advisers — Staff" };

type SearchParams = Promise<StaffSearchParams>;

export default async function StaffAdvisersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <StaffShell activeTab="advisers">
      <AdvisersTab params={params} basePath="/registrar/staff/advisers" />
    </StaffShell>
  );
}
