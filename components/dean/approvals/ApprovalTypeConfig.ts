// path: components/dean/approvals/ApprovalTypeConfig.ts

export type ApprovalTypeKey = "schedules" | "timeConfig" | "capabilities" | "feeSetups";

export const APPROVAL_TYPE_KEYS: ApprovalTypeKey[] = [
  "schedules",
  "timeConfig",
  "capabilities",
  "feeSetups",
];

export const APPROVAL_TYPE_LABELS: Record<ApprovalTypeKey, string> = {
  schedules: "Schedules",
  timeConfig: "Time Config",
  capabilities: "Teacher Capabilities",
  feeSetups: "Fee Setups",
};

export type ApprovalStatusFilter = "submitted" | "approved" | "rejected" | "all";

/** Status filter options per type. Schedules only have pending in DB. */
export const STATUS_OPTIONS: Record<ApprovalTypeKey, ApprovalStatusFilter[]> = {
  schedules: ["submitted", "all"],
  timeConfig: ["submitted", "approved", "rejected", "all"],
  capabilities: ["submitted", "approved", "rejected", "all"],
  feeSetups: ["submitted", "approved", "rejected", "all"],
};

export interface ApprovalQueueRow {
  id: string;
  title: string;
  program?: string | null;
  term?: string | null;
  schoolYear?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  status: string;
  /** Optional; blocks approval when true (e.g. schedule override). */
  hasIssues?: boolean;
}
