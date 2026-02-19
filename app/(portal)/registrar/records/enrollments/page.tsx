import { RecordsShell } from "../RecordsShell";
import { EnrollmentsTab, type RecordsSearchParams } from "../RecordsTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Enrollments — Records" };

type SearchParams = Promise<RecordsSearchParams>;

export default async function RecordsEnrollmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <RecordsShell activeTab="enrollments">
      <EnrollmentsTab params={params} basePath="/registrar/records/enrollments" />
    </RecordsShell>
  );
}
