// path: app/(portal)/dean/fees/page.tsx
import { getFeeSetupsPendingDean } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { DeanFeeApprovalRow } from "./DeanFeeApprovalRow";

export const dynamic = "force-dynamic";

export default async function DeanFeesPage() {
  const setups = await getFeeSetupsPendingDean();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Fee Approvals
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Final approval for fee setups. These have already been approved by Program Heads.
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
                <DeanFeeApprovalRow
                  key={s.id}
                  feeSetupId={s.id}
                  programCode={s.programCode ?? ""}
                  programName={s.programName ?? ""}
                  yearLevel={s.yearLevel}
                  schoolYearName={s.schoolYearName}
                  termName={s.termName}
                  tuitionPerUnit={s.tuitionPerUnit ?? "0"}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
