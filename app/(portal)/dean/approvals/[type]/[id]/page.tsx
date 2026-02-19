// path: app/(portal)/dean/approvals/[type]/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getScheduleApprovalDetails,
  listScheduleTimeConfigs,
  getCapabilityPackageById,
  listCapabilityLines,
  getFeeSetupWithDetails,
} from "@/db/queries";
import { ApprovalReview } from "@/components/dean/approvals/ApprovalReview";
import { Badge } from "@/components/ui/badge";
import { FeeSetupDetailView } from "@/app/(portal)/program-head/fees/FeeSetupDetailView";
import { computeFeeSetupTotals } from "@/lib/fees/totals";
import type { FeeSetupLine } from "@/lib/fees/types";
import type { ApprovalTypeKey } from "@/components/dean/approvals/ApprovalTypeConfig";

export const dynamic = "force-dynamic";
export const metadata = { title: "Review" };

const VALID_TYPES: ApprovalTypeKey[] = [
  "schedules",
  "timeConfig",
  "capabilities",
  "feeSetups",
];

function formatTime(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}

export default async function DeanApprovalReviewPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!VALID_TYPES.includes(type as ApprovalTypeKey)) notFound();
  const typeKey = type as ApprovalTypeKey;
  const backHref = `/dean/approvals?tab=${typeKey}`;

  if (typeKey === "schedules") {
    const details = await getScheduleApprovalDetails(id);
    if (!details) notFound();
    const title = `${details.subjectCode} – ${details.sectionName}`;
    return (
      <ApprovalReview
        typeKey="schedules"
        id={id}
        title={title}
        status={details.status}
        hasIssues={details.hasTeacherOverride ?? false}
        backHref={backHref}
      >
        <>
          {details.hasTeacherOverride && details.overrideReason && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 mb-4">
              <p className="font-semibold text-amber-900">Teacher override reason</p>
              <p className="text-sm text-amber-800 mt-1 italic">
                &quot;{details.overrideReason}&quot;
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-neutral-600">Subject:</span>
              <div className="font-medium text-[#6A0000]">
                {details.subjectCode} – {details.subjectTitle}
              </div>
            </div>
            <div>
              <span className="text-neutral-600">Section:</span>
              <div className="font-medium">{details.sectionName}</div>
            </div>
            <div>
              <span className="text-neutral-600">Teacher:</span>
              <div className="font-medium">{details.teacherName || "—"}</div>
            </div>
            <div>
              <span className="text-neutral-600">Room:</span>
              <div className="font-medium">{details.room || "—"}</div>
            </div>
            <div>
              <span className="text-neutral-600">Time:</span>
              <div className="font-medium">
                {details.timeIn || "—"} – {details.timeOut || "—"}
              </div>
            </div>
            <div>
              <span className="text-neutral-600">Days:</span>
              <div className="flex gap-1 mt-1 flex-wrap">
                {(details.days ?? []).map((day) => (
                  <Badge key={day} variant="outline" className="text-xs">
                    {day}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </>
      </ApprovalReview>
    );
  }

  if (typeKey === "timeConfig") {
    const list = await listScheduleTimeConfigs({});
    const config = list.find((c) => c.id === id);
    if (!config) notFound();
    const title = config.title ?? "Time Config";
    return (
      <ApprovalReview
        typeKey="timeConfig"
        id={id}
        title={title}
        program={config.programCode ?? config.programName ?? null}
        status={config.status}
        backHref={backHref}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-neutral-600">Program:</span>
            <div className="font-medium">{config.programCode ?? config.programName ?? "—"}</div>
          </div>
          <div>
            <span className="text-neutral-600">Time range:</span>
            <div className="font-medium">
              {formatTime(config.startHour)} – {formatTime(config.endHour)}
            </div>
          </div>
          <div>
            <span className="text-neutral-600">Increment:</span>
            <div className="font-medium">{config.timeIncrement} mins</div>
          </div>
          <div>
            <span className="text-neutral-600">Submitted:</span>
            <div className="font-medium">
              {config.submittedAt
                ? new Date(config.submittedAt).toLocaleString()
                : "—"}
            </div>
          </div>
        </div>
      </ApprovalReview>
    );
  }

  if (typeKey === "capabilities") {
    const [pkg, lines] = await Promise.all([
      getCapabilityPackageById(id),
      listCapabilityLines(id),
    ]);
    if (!pkg) notFound();
    const title = pkg.title ?? "Capability Package";
    return (
      <ApprovalReview
        typeKey="capabilities"
        id={id}
        title={title}
        program={pkg.programCode ?? pkg.programName ?? null}
        term={pkg.termName ?? null}
        schoolYear={pkg.schoolYearName ?? null}
        status={pkg.status}
        backHref={backHref}
      >
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
              <tr>
                <th className="px-4 py-2">Teacher</th>
                <th className="px-4 py-2">Subject</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    {line.teacherFirstName} {line.teacherLastName}
                  </td>
                  <td className="px-4 py-2">
                    {line.subjectCode} – {line.subjectTitle}
                  </td>
                  <td className="px-4 py-2">
                    {line.capabilityType === "major_department" ? (
                      <Badge className="bg-neutral-100 text-neutral-800">Major</Badge>
                    ) : line.capabilityType === "ge" ? (
                      <Badge className="bg-blue-100 text-blue-800">GE</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800">Cross</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-neutral-600 text-xs">
                    {line.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ApprovalReview>
    );
  }

  if (typeKey === "feeSetups") {
    const details = await getFeeSetupWithDetails(id);
    if (!details) notFound();
    if (details.setup.status !== "pending_dean") {
      return (
        <div className="space-y-4">
          <Link href={backHref} className="text-sm text-[#6A0000] hover:underline">
            ← Back to Approvals
          </Link>
          <p className="text-neutral-600">
            This fee setup is not pending your approval.
          </p>
        </div>
      );
    }
    const lines: FeeSetupLine[] = details.lines.map((l) => ({
      id: l.id,
      feeSetupId: l.feeSetupId,
      lineType: l.lineType,
      label: l.label,
      amount: l.amount ?? "0",
      qty: l.qty ?? 1,
      perUnit: l.perUnit ?? false,
      sortOrder: l.sortOrder ?? 0,
    }));
    const totalUnits = 0;
    const tuitionPerUnit = parseFloat(details.setup.tuitionPerUnit ?? "0");
    const totals = computeFeeSetupTotals(lines, totalUnits, tuitionPerUnit);
    const title = `${details.setup.programCode ?? ""} – ${details.setup.programName ?? "Fee Setup"}`.trim();
    return (
      <ApprovalReview
        typeKey="feeSetups"
        id={id}
        title={title}
        program={details.setup.programCode ?? details.setup.programName ?? null}
        term={details.setup.termName ?? null}
        schoolYear={details.setup.schoolYearName ?? null}
        status="pending_dean"
        backHref={backHref}
      >
        <FeeSetupDetailView
          setup={{
            programCode: details.setup.programCode,
            programName: details.setup.programName,
            yearLevel: details.setup.yearLevel,
            schoolYearName: details.setup.schoolYearName,
            termName: details.setup.termName,
            tuitionPerUnit: details.setup.tuitionPerUnit,
          }}
          lines={details.lines.map((l) => ({
            lineType: l.lineType,
            label: l.label,
            amount: l.amount ?? "0",
            qty: l.qty ?? 1,
          }))}
          totals={totals}
          totalUnits={totalUnits}
        />
      </ApprovalReview>
    );
  }

  notFound();
}
