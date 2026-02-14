import {
  getFeeItems,
  getProgramFeeRules,
} from "@/lib/finance/queries";
import { getSchoolYearsList, getTermsList } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateFeeItemForm } from "./CreateFeeItemForm";
import { CreateProgramFeeRuleForm } from "./CreateProgramFeeRuleForm";
import { FeeItemRowActions } from "./FeeItemRowActions";
import { ProgramFeeRuleRowActions } from "./ProgramFeeRuleRowActions";

export const dynamic = "force-dynamic";

export default async function FeeSetupPage() {
  const [feeItems, programFeeRules, schoolYears, terms] = await Promise.all([
    getFeeItems(false),
    getProgramFeeRules(),
    getSchoolYearsList(),
    getTermsList(),
  ]);

  const feeItemsForForm = feeItems.map((f) => ({
    id: f.id,
    code: f.code,
    name: f.name,
  }));
  const schoolYearsForForm = schoolYears.map((s) => ({ id: s.id, name: s.name }));
  const termsForForm = terms.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Fee Setup
        </h2>
        <p className="text-sm text-neutral-800">
          Manage fee items and program fee rules.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-[#6A0000]">
          Fee Items
        </h3>
        <CreateFeeItemForm />
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              All fee items ({feeItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
              <table className="min-w-full text-left text-sm text-neutral-900">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Default Amount</th>
                    <th className="px-4 py-2">Active</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feeItems.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-neutral-50/80"
                    >
                      <td className="px-4 py-2 font-mono font-medium">
                        {row.code}
                      </td>
                      <td className="px-4 py-2">{row.name}</td>
                      <td className="px-4 py-2 capitalize">{row.category}</td>
                      <td className="px-4 py-2">
                        {row.defaultAmount
                          ? `₱${parseFloat(row.defaultAmount).toFixed(2)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            row.active
                              ? "bg-green-100 text-green-800"
                              : "bg-neutral-200 text-neutral-800"
                          }`}
                        >
                          {row.active ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <FeeItemRowActions feeItem={row} />
                      </td>
                    </tr>
                  ))}
                  {feeItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-sm text-neutral-800"
                      >
                        No fee items yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-[#6A0000]">
          Program Fee Rules
        </h3>
        <CreateProgramFeeRuleForm
          feeItems={feeItemsForForm}
          schoolYears={schoolYearsForForm}
          terms={termsForForm}
        />
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-neutral-900">
              All program fee rules ({programFeeRules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
              <table className="min-w-full text-left text-sm text-neutral-900">
                <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                  <tr>
                    <th className="px-4 py-2">Program</th>
                    <th className="px-4 py-2">Year Level</th>
                    <th className="px-4 py-2">School Year</th>
                    <th className="px-4 py-2">Term</th>
                    <th className="px-4 py-2">Fee Item</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {programFeeRules.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-neutral-50/80"
                    >
                      <td className="px-4 py-2">{row.program}</td>
                      <td className="px-4 py-2">{row.yearLevel ?? "—"}</td>
                      <td className="px-4 py-2">
                        {row.schoolYearId
                          ? schoolYears.find((s) => s.id === row.schoolYearId)
                              ?.name ?? "—"
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {row.termId
                          ? terms.find((t) => t.id === row.termId)?.name ?? "—"
                          : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {row.feeCode} – {row.feeName}
                      </td>
                      <td className="px-4 py-2">
                        ₱{parseFloat(row.amount ?? "0").toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <ProgramFeeRuleRowActions
                          rule={row}
                          feeItems={feeItemsForForm}
                          schoolYears={schoolYearsForForm}
                          terms={termsForForm}
                        />
                      </td>
                    </tr>
                  ))}
                  {programFeeRules.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-neutral-800"
                      >
                        No program fee rules yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
