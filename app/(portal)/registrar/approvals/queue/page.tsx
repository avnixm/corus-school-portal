import { getProgramsList } from "@/db/queries";
import { ApprovalsShell } from "../ApprovalsShell";
import { QueueTab, type ApprovalsSearchParams } from "../ApprovalsTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Document queue — Approvals & Compliance" };

type SearchParams = Promise<ApprovalsSearchParams>;

export default async function ApprovalsQueuePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const programs = await getProgramsList(true);

  return (
    <ApprovalsShell activeTab="queue">
      <div className="space-y-4">
        <QueueTab
          params={params}
          programs={programs}
          basePath="/registrar/approvals/queue"
        />
      </div>
    </ApprovalsShell>
  );
}
