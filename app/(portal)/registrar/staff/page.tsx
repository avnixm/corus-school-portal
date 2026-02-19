import { StaffShell } from "./StaffShell";
import { TeachersTab, AdvisersTab, type StaffSearchParams } from "./StaffTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Staff" };

type SearchParams = Promise<StaffSearchParams>;

export default async function StaffPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tab = params.tab === "advisers" ? "advisers" : "teachers";

  return (
    <StaffShell activeTab={tab}>
      {tab === "teachers" && <TeachersTab />}
      {tab === "advisers" && (
        <AdvisersTab params={params} basePath="/registrar/staff" tabValue="advisers" />
      )}
    </StaffShell>
  );
}
