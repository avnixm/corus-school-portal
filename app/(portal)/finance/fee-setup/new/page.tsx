// path: app/(portal)/finance/fee-setup/new/page.tsx
import { getProgramsList, getSchoolYearsList, getTermsList } from "@/db/queries";
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
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link
          href="/finance/fee-setup"
          className="text-sm font-medium text-[#6A0000] hover:underline"
        >
          ← Fee Setup
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#6A0000]">
          Create fee setup
        </h1>
        <p className="mt-0.5 text-sm text-neutral-600">
          Create a new fee setup draft. Set scope and tuition per unit, then add lab, misc, and other fee lines in the editor.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#6A0000]">New fee setup</h2>
        </div>
        <div className="p-4">
          <CreateFeeSetupForm
            programs={programs.map((p) => ({ id: p.id, code: p.code, name: p.name }))}
            schoolYears={schoolYears.map((s) => ({ id: s.id, name: s.name }))}
            terms={terms.map((t) => ({ id: t.id, name: t.name }))}
          />
        </div>
      </div>
    </div>
  );
}
