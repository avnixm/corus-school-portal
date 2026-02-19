import { getCurrentUserWithRole } from "@/lib/auth/getCurrentUserWithRole";
import { getProgramHeadScopeAndSyTerm } from "@/lib/programHead/pageContext";
import { getClearanceOverview } from "@/lib/programHead/queries";
import { getFeeSetupsPendingProgramHead } from "@/db/queries";
import { ProgramHeadScopeGate } from "@/components/portal/programHead/ProgramHeadScopeGate";
import { ClearanceFilters } from "@/app/(portal)/program-head/clearance/ClearanceFilters";
import { FinancePageContent } from "./FinancePageContent";

export const dynamic = "force-dynamic";

export const metadata = { title: "Finance" };

export default async function ProgramHeadFinancePage({
  searchParams,
}: {
  searchParams: Promise<{
    schoolYearId?: string;
    termId?: string;
    yearLevel?: string;
    status?: string;
    view?: string;
  }>;
}) {
  const user = await getCurrentUserWithRole();
  if (!user) return null;
  const params = await searchParams;
  const { scope, schoolYears, terms, syId, termId, needsScope } =
    await getProgramHeadScopeAndSyTerm(user.userId, {
      schoolYearId: params.schoolYearId,
      termId: params.termId,
    });

  if (needsScope) {
    return <ProgramHeadScopeGate title="Finance" />;
  }

  const [clearanceRows, feeSetups] = await Promise.all([
    getClearanceOverview(scope!, {
      schoolYearId: syId ?? undefined,
      termId: termId ?? undefined,
      yearLevel: params.yearLevel,
      status: params.status,
    }),
    getFeeSetupsPendingProgramHead(scope ?? []),
  ]);

  const view = params.view === "fees" ? "fees" : "clearance";

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Finance
        </h2>
        <p className="mt-1 text-sm text-neutral-800">
          Clearance: read-only overview. Fee Approvals: review and approve fee setups for your programs.
        </p>
      </section>

      {view === "clearance" && (
        <ClearanceFilters
          basePath="/program-head/finance"
          schoolYears={schoolYears}
          terms={terms}
          current={{ schoolYearId: syId, termId, yearLevel: params.yearLevel, status: params.status }}
        />
      )}

      <FinancePageContent
        view={view}
        clearanceRows={clearanceRows.map((r) => ({
          enrollmentId: r.enrollmentId,
          studentCode: r.studentCode,
          firstName: r.firstName,
          middleName: r.middleName,
          lastName: r.lastName,
          schoolYearName: r.schoolYearName,
          termName: r.termName,
          program: r.program,
          yearLevel: r.yearLevel,
          balance: r.balance,
          financeStatus: r.financeStatus,
          updatedAt: r.updatedAt,
        }))}
        feeSetups={feeSetups.map((s) => ({
          id: s.id,
          programCode: s.programCode,
          programName: s.programName,
          yearLevel: s.yearLevel,
          schoolYearName: s.schoolYearName,
          termName: s.termName,
          tuitionPerUnit: s.tuitionPerUnit,
        }))}
      />
    </div>
  );
}
