import {
  getFeeItems,
  getProgramFeeRules,
} from "@/lib/finance/queries";
import {
  getSchoolYearsList,
  getTermsList,
  getFeeSetupsList,
} from "@/db/queries";
import Link from "next/link";
import { CreateFeeItemForm } from "./CreateFeeItemForm";
import { CreateProgramFeeRuleForm } from "./CreateProgramFeeRuleForm";
import { FeeItemRowActions } from "./FeeItemRowActions";
import { ProgramFeeRuleRowActions } from "./ProgramFeeRuleRowActions";
import { formatStatusForDisplay } from "@/lib/formatStatus";

export const dynamic = "force-dynamic";

export const metadata = { title: "Fee Setup" };

export default async function FeeSetupPage() {
  const [feeItems, programFeeRules, schoolYears, terms, feeSetups] =
    await Promise.all([
      getFeeItems(false),
      getProgramFeeRules(),
      getSchoolYearsList(),
      getTermsList(),
      getFeeSetupsList(),
    ]);

  const feeItemsForForm = feeItems.map((f) => ({
    id: f.id,
    code: f.code,
    name: f.name,
  }));
  const schoolYearsForForm = schoolYears.map((s) => ({ id: s.id, name: s.name }));
  const termsForForm = terms.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Fee Setup
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage fee items, program fee rules, and enrollment/assessment fee setups.
        </p>
      </header>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#6A0000]">
              Fee setups (enrollment / assessment)
            </h2>
            <p className="mt-0.5 text-sm text-neutral-600">
              Define fee structures per program, year, and term. Requires Program Head + Dean approval before use in assessments.
            </p>
          </div>
          <Link
            href="/finance/fee-setup/new"
            className="inline-flex h-10 items-center rounded-lg bg-[#6A0000] px-4 text-sm font-medium text-white hover:bg-[#4A0000]"
          >
            Create fee setup
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
            <h3 className="text-sm font-semibold text-[#6A0000]">
              All fee setups ({feeSetups.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Program</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Year</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">School year</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Term</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeSetups.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {row.programCode ?? "—"} {row.programName ? `– ${row.programName}` : ""}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{row.yearLevel ?? "All"}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.schoolYearName ?? "Any"}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.termName ?? "Any"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium uppercase ${
                          row.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : row.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : row.status === "draft"
                                ? "bg-[#6A0000]/10 text-[#6A0000]"
                                : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {formatStatusForDisplay(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/finance/fee-setup/${row.id}`}
                        className="font-medium text-[#6A0000] hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {feeSetups.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-neutral-500"
                    >
                      No fee setups yet. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#6A0000]">
          Fee items
        </h2>
        <CreateFeeItemForm />
        <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
            <h3 className="text-sm font-semibold text-[#6A0000]">
              All fee items ({feeItems.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Code</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Name</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Category</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Default amount</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Active</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeItems.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-neutral-900">{row.code}</td>
                    <td className="px-4 py-3 text-neutral-900">{row.name}</td>
                    <td className="px-4 py-3 capitalize text-neutral-700">{row.category}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {row.defaultAmount ? `₱${parseFloat(row.defaultAmount).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium uppercase ${
                          row.active ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {row.active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <FeeItemRowActions feeItem={row} />
                    </td>
                  </tr>
                ))}
                {feeItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-neutral-500">
                      No fee items yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-[#6A0000]">
          Program fee rules
        </h2>
        <CreateProgramFeeRuleForm
          feeItems={feeItemsForForm}
          schoolYears={schoolYearsForForm}
          terms={termsForForm}
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
            <h3 className="text-sm font-semibold text-[#6A0000]">
              All program fee rules ({programFeeRules.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/50">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Program</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Year level</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">School year</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Term</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Fee item</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-neutral-500">Amount</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {programFeeRules.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">{row.program}</td>
                    <td className="px-4 py-3 text-neutral-700">{row.yearLevel ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {row.schoolYearId
                        ? schoolYears.find((s) => s.id === row.schoolYearId)?.name ?? "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {row.termId ? terms.find((t) => t.id === row.termId)?.name ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-900">
                      {row.feeCode} – {row.feeName}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#6A0000]">
                      ₱{parseFloat(row.amount ?? "0").toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
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
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-neutral-500">
                      No program fee rules yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
