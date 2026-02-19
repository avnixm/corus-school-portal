import { getCachedProgramsList } from "@/lib/db/cache";
import { ApprovalsShell } from "./ApprovalsShell";
import { EnrollmentsTab, QueueTab, RequirementsTab, type ApprovalsSearchParams } from "./ApprovalsTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Approvals & Compliance" };

type SearchParams = Promise<ApprovalsSearchParams>;

export default async function ApprovalsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tab =
    params.tab === "queue"
      ? "queue"
      : params.tab === "requirements"
        ? "requirements"
        : "enrollments";

  const programs = await getCachedProgramsList(true);

  return (
    <ApprovalsShell activeTab={tab}>
      {tab === "enrollments" && (
        <div className="space-y-4">
          <EnrollmentsTab params={params} programs={programs} />
        </div>
      )}
      {tab === "queue" && (
        <div className="space-y-4">
          <QueueTab params={params} programs={programs} basePath="/registrar/approvals" tabValue="queue" />
        </div>
      )}
      {tab === "requirements" && (
        <RequirementsTab />
      )}
    </ApprovalsShell>
  );
}
