// path: app/(portal)/dean/approvals/actions.ts
"use server";

import {
  listPendingScheduleApprovalsForDean,
  listScheduleTimeConfigs,
  listCapabilityPackagesByStatus,
  getFeeSetupsPendingDean,
  getFeeSetupsList,
  getSchoolYearsList,
  getTermsList,
  getProgramsList,
} from "@/db/queries";
import type { ApprovalTypeKey, ApprovalStatusFilter, ApprovalQueueRow } from "@/components/dean/approvals/ApprovalTypeConfig";

export interface ListFilters {
  schoolYearId?: string;
  termId?: string;
  programId?: string;
  search?: string;
}

export async function listApprovalItems(
  typeKey: ApprovalTypeKey,
  status: ApprovalStatusFilter,
  filters: ListFilters
): Promise<ApprovalQueueRow[]> {
  switch (typeKey) {
    case "schedules": {
      const list = await listPendingScheduleApprovalsForDean(
        filters.schoolYearId,
        filters.termId
      );
      const items = status === "rejected" || status === "approved" ? [] : list;
      return items.map((a) => ({
        id: a.approvalId,
        title: `${a.subjectCode} – ${a.sectionName}`,
        program: null,
        term: null,
        schoolYear: null,
        submittedBy: null,
        submittedAt: a.submittedAt ? new Date(a.submittedAt).toISOString() : null,
        status: "submitted",
        hasIssues: a.hasTeacherOverride ?? false,
      }));
    }
    case "timeConfig": {
      const statusFilter =
        status === "all"
          ? undefined
          : (status as "submitted" | "approved" | "rejected");
      const list = await listScheduleTimeConfigs({
        status: statusFilter,
        programId: filters.programId,
      });
      return list.map((c) => ({
        id: c.id,
        title: c.title ?? "Time Config",
        program: c.programCode ?? c.programName ?? null,
        term: null,
        schoolYear: null,
        submittedBy: null,
        submittedAt: c.submittedAt ? new Date(c.submittedAt).toISOString() : null,
        status: c.status,
      }));
    }
    case "capabilities": {
      const statusFilter =
        status === "all"
          ? undefined
          : (status as "submitted" | "approved" | "rejected");
      const lists = await Promise.all([
        statusFilter === "submitted" || !statusFilter
          ? listCapabilityPackagesByStatus("submitted")
          : [],
        statusFilter === "approved" || !statusFilter
          ? listCapabilityPackagesByStatus("approved")
          : [],
        statusFilter === "rejected" || !statusFilter
          ? listCapabilityPackagesByStatus("rejected")
          : [],
      ]);
      const combined =
        statusFilter === "submitted"
          ? lists[0]
          : statusFilter === "approved"
            ? lists[1]
            : statusFilter === "rejected"
              ? lists[2]
              : [...lists[0], ...lists[1], ...lists[2]];
      return combined.map((p) => ({
        id: p.id,
        title: p.title ?? `Capability Package`,
        program: p.programCode ?? p.programName ?? null,
        term: p.termName ?? null,
        schoolYear: p.schoolYearName ?? null,
        submittedBy: null,
        submittedAt: p.submittedAt ? new Date(p.submittedAt).toISOString() : null,
        status: p.status,
      }));
    }
    case "feeSetups": {
      if (status === "submitted" || status === "all") {
        const pending = await getFeeSetupsPendingDean();
        const rows: ApprovalQueueRow[] = pending.map((s) => ({
          id: s.id,
          title: `${s.programCode ?? ""} – ${s.programName ?? ""}`.trim() || "Fee Setup",
          program: s.programCode ?? s.programName ?? null,
          term: s.termName ?? null,
          schoolYear: s.schoolYearName ?? null,
          submittedBy: null,
          submittedAt: null,
          status: "pending_dean",
        }));
        if (status === "submitted") return rows;
        const approved = await getFeeSetupsList({ status: "approved" });
        const rejected = await getFeeSetupsList({ status: "rejected" });
        return [
          ...rows,
          ...approved.map((s) => ({
            id: s.id,
            title: `${s.programCode ?? ""} – ${s.programName ?? ""}`.trim() || "Fee Setup",
            program: s.programCode ?? s.programName ?? null,
            term: s.termName ?? null,
            schoolYear: s.schoolYearName ?? null,
            submittedBy: null,
            submittedAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
            status: s.status,
          })),
          ...rejected.map((s) => ({
            id: s.id,
            title: `${s.programCode ?? ""} – ${s.programName ?? ""}`.trim() || "Fee Setup",
            program: s.programCode ?? s.programName ?? null,
            term: s.termName ?? null,
            schoolYear: s.schoolYearName ?? null,
            submittedBy: null,
            submittedAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
            status: s.status,
          })),
        ];
      }
      const list = await getFeeSetupsList({
        status: status === "approved" ? "approved" : "rejected",
        programId: filters.programId,
        schoolYearId: filters.schoolYearId,
        termId: filters.termId,
      });
      return list.map((s) => ({
        id: s.id,
        title: `${s.programCode ?? ""} – ${s.programName ?? ""}`.trim() || "Fee Setup",
        program: s.programCode ?? s.programName ?? null,
        term: s.termName ?? null,
        schoolYear: s.schoolYearName ?? null,
        submittedBy: null,
        submittedAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
        status: s.status,
      }));
    }
    default:
      return [];
  }
}

export async function getApprovalFiltersOptions() {
  const [schoolYears, terms, programs] = await Promise.all([
    getSchoolYearsList(),
    getTermsList(),
    getProgramsList(true),
  ]);
  return {
    schoolYears: schoolYears.map((sy) => ({ id: sy.id, name: sy.name })),
    terms: terms.map((t) => ({ id: t.id, name: t.name })),
    programs: (programs as { id: string; code: string; name: string }[]).map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
    })),
  };
}
