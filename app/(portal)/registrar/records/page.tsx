import { RecordsShell } from "./RecordsShell";
import { StudentsTab, EnrollmentsTab, type RecordsSearchParams } from "./RecordsTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Records" };

type SearchParams = Promise<RecordsSearchParams>;

export default async function RecordsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tab = params.tab === "enrollments" ? "enrollments" : "students";

  return (
    <RecordsShell activeTab={tab}>
      {tab === "students" && (
        <StudentsTab params={params} basePath="/registrar/records" tabValue="students" />
      )}
      {tab === "enrollments" && (
        <EnrollmentsTab params={params} basePath="/registrar/records" tabValue="enrollments" />
      )}
    </RecordsShell>
  );
}
