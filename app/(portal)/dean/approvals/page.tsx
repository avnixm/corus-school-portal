// path: app/(portal)/dean/approvals/page.tsx
import { listApprovalItems, getApprovalFiltersOptions } from "./actions";
import { ApprovalsHub } from "@/components/dean/approvals/ApprovalsHub";
import type { ApprovalTypeKey, ApprovalStatusFilter } from "@/components/dean/approvals/ApprovalTypeConfig";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approvals" };

export default async function DeanApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    schoolYearId?: string;
    termId?: string;
    programId?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const tab = (params.tab as ApprovalTypeKey) ?? "schedules";
  const status = (params.status as ApprovalStatusFilter) ?? "submitted";
  const validTab: ApprovalTypeKey =
    ["schedules", "timeConfig", "capabilities", "feeSetups"].includes(tab)
      ? tab
      : "schedules";

  const [items, filterOptions] = await Promise.all([
    listApprovalItems(validTab, status, {
      schoolYearId: params.schoolYearId,
      termId: params.termId,
      programId: params.programId,
      search: params.search,
    }),
    getApprovalFiltersOptions(),
  ]);

  return (
    <ApprovalsHub
      initialTab={validTab}
      initialStatus={status}
      items={items}
      schoolYears={filterOptions.schoolYears}
      terms={filterOptions.terms}
      programs={filterOptions.programs}
    />
  );
}
