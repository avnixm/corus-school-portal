import { ApprovalsShell } from "../ApprovalsShell";
import { RequirementsTab } from "../ApprovalsTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Requirements — Approvals & Compliance" };

export default async function ApprovalsRequirementsPage() {
  return (
    <ApprovalsShell activeTab="requirements">
      <RequirementsTab />
    </ApprovalsShell>
  );
}
