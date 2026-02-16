// path: app/(portal)/program-head/fees/page.tsx
import { getFeeSetupsPendingProgramHead } from "@/db/queries";
import { getProgramHeadScopePrograms } from "@/lib/programHead/scope";
import { auth } from "@/lib/auth/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FeeApprovalRow } from "./FeeApprovalRow";

export const dynamic = "force-dynamic";

export const metadata = { title: "Fees" };

export default async function ProgramHeadFeesPage() {
  const session = (await auth.getSession())?.data;
  const userId = session?.user?.id;
  const scope = userId ? await getProgramHeadScopePrograms(userId) : null;
  const setups = await getFeeSetupsPendingProgramHead(scope ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Fee Approvals
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Review and approve fee setups for your assigned programs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Pending your approval ({setups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {setups.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-600">
              No fee setups pending your approval.
            </p>
          ) : (
            <div className="space-y-4">
              {setups.map((s) => (
                <FeeApprovalRow
                  key={s.id}
                  feeSetupId={s.id}
                  programCode={s.programCode ?? ""}
                  programName={s.programName ?? ""}
                  yearLevel={s.yearLevel}
                  schoolYearName={s.schoolYearName}
                  termName={s.termName}
                  tuitionPerUnit={s.tuitionPerUnit ?? "0"}
                  variant="program_head"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
