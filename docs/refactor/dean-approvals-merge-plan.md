# Dean Approvals Merge Plan

## Existing routes → New hub tab mapping

| Old route | New location |
|-----------|--------------|
| `/dean/schedules` | `/dean/approvals` tab **Schedules** |
| `/dean/schedule-time-config` | `/dean/approvals` tab **Time Config** |
| `/dean/teacher-capabilities` | `/dean/approvals` tab **Teacher Capabilities** |
| `/dean/fees` | `/dean/approvals` tab **Fee Setups** |

## Old review routes → New canonical review mapping

| Old route | New canonical route |
|-----------|---------------------|
| `/dean/fees/[feeSetupId]` | `/dean/approvals/feeSetups/[feeSetupId]` |
| `/dean/teacher-capabilities/[packageId]` | `/dean/approvals/capabilities/[packageId]` |
| Schedule review (dialog only, no page) | `/dean/approvals/schedules/[approvalId]` |
| Time config (inline buttons only) | `/dean/approvals/timeConfig/[configId]` |

## Components: delete / keep / reuse

- **Delete (replaced by hub):** None. Legacy pages become redirect-only; components stay for reuse.
- **Keep & reuse:**  
  - `ScheduleApprovalTable` → used inside ApprovalQueue or review for schedules (or inline table in queue).  
  - `ReviewScheduleDialog` → logic moved to canonical review page; dialog can remain for backward compat or be replaced by page.  
  - `ApproveRejectButtons` (time config) → replaced by shared Approve/Reject in review page.  
  - `DeanCapabilityTabs` / `DeanCapabilityReview` → reuse review content in `/dean/approvals/capabilities/[id]`; queue uses shared ApprovalQueue.  
  - `DeanFeeApprovalRow` / `DeanFeeApprovalActions` → reuse in fee setup review page; queue uses shared row/link.  
- **New shared:**  
  - `ApprovalsHub.tsx`, `ApprovalQueue.tsx`, `ApprovalReview.tsx`, `ApproveDialog.tsx`, `RejectDialog.tsx`, `ApprovalTypeConfig.ts`.

## Actions / DB queries reused per type

| Type | list (status/filters) | read one | approve | reject |
|------|----------------------|----------|---------|--------|
| **schedules** | `listPendingScheduleApprovalsForDean(schoolYearId?, termId?)` (pending only) | API `GET /api/dean/schedules/[approvalId]` + `getScheduleApprovalDetails` | `approveScheduleAction` / `approveSchedule` | `rejectScheduleAction` / `rejectSchedule` |
| **timeConfig** | `listScheduleTimeConfigs({ status?, programId? })` | (inline in list; no separate read) | `approveScheduleTimeConfigAction` / `approveScheduleTimeConfig` | `rejectScheduleTimeConfigAction` / `rejectScheduleTimeConfig` |
| **capabilities** | `listCapabilityPackagesByStatus(status)` | `readCapabilityPackageAction` / `getCapabilityPackageById` + `listCapabilityLines` | `approveCapabilityPackageAction` / `approveCapabilityPackageDb` | `rejectCapabilityPackageAction` / `rejectCapabilityPackageDb` |
| **feeSetups** | `getFeeSetupsPendingDean()` (submitted); `getFeeSetupsList({ status })` (approved/rejected) | `getFeeSetupWithDetails` | `approveFeeSetupAsDean` | `rejectFeeSetupAsDean` |

## Notes

- Schedules: DB only exposes pending list; status filter in hub is "Submitted" | "All" (same data).
- Time config: No dedicated "read one" API; review page can fetch by listing with id or add a minimal getter if needed. Currently review is inline in the list; canonical review page will need a way to load one config (e.g. listScheduleTimeConfigs and find by id, or add getScheduleTimeConfigById if desired; existing code uses list only).
- Fee setups: For "Approved" / "Rejected" tabs use `getFeeSetupsList({ status: "approved" })` / `getFeeSetupsList({ status: "rejected" })`.
- API route `/api/dean/schedules/[approvalId]` is unchanged.
