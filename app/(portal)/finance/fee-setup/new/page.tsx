// path: app/(portal)/finance/fee-setup/new/page.tsx
import { getProgramsList, getSchoolYearsList, getTermsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CreateFeeSetupForm } from "../CreateFeeSetupForm";

export const dynamic = "force-dynamic";

export default async function NewFeeSetupPage() {
  const [programs, schoolYears, terms] = await Promise.all([
    getProgramsList(true),
    getSchoolYearsList(),
    getTermsList(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/finance/fee-setup"
          className="text-sm text-[#6A0000] hover:underline"
        >
          ← Fee Setup
        </Link>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#6A0000]">
          Create Fee Setup
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Create a new fee setup draft. You can add lab, misc, and other fee lines in the editor.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            New fee setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateFeeSetupForm
            programs={programs.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
            schoolYears={schoolYears.map((s) => ({ id: s.id, name: s.name }))}
            terms={terms.map((t) => ({ id: t.id, name: t.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
