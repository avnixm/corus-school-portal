import { RecordsShell } from "../RecordsShell";
import { StudentsTab, type RecordsSearchParams } from "../RecordsTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Students — Records" };

type SearchParams = Promise<RecordsSearchParams>;

export default async function RecordsStudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <RecordsShell activeTab="students">
      <StudentsTab params={params} basePath="/registrar/records/students" />
    </RecordsShell>
  );
}
