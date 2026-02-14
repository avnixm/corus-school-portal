// path: app/(portal)/finance/fee-setup/FeeSetupEditor.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import {
  addFeeSetupLineAction,
  updateFeeSetupLineAction,
  deleteFeeSetupLineAction,
  submitFeeSetupForApproval,
  seedDefaultMiscLines,
  updateFeeSetupDraft,
} from "./fee-setups/actions";

type Setup = {
  id: string;
  programId: string | null;
  yearLevel: string | null;
  schoolYearId: string | null;
  termId: string | null;
  status: string;
  tuitionPerUnit: string | null;
  notes: string | null;
};

type Line = {
  id: string;
  feeSetupId: string;
  lineType: string;
  label: string;
  amount: string;
  qty: number;
  perUnit: boolean;
  sortOrder: number;
};

type Approval = {
  programHeadStatus: string;
  programHeadRemarks: string | null;
  deanStatus: string;
  deanRemarks: string | null;
} | null;

type Totals = {
  tuitionAmount: number;
  labTotal: number;
  miscTotal: number;
  otherTotal: number;
  total: number;
};

const inputClass =
  "h-9 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#6A0000] focus:border-[#6A0000] disabled:opacity-60";
const selectClass =
  "mt-1 h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#6A0000] disabled:opacity-60";

function FeeLineRow({
  line,
  canEdit,
  pending,
  onUpdate,
  onDeleteRequest,
}: {
  line: Line;
  canEdit: boolean;
  pending: boolean;
  onUpdate: (updates: { label?: string; amount?: string }) => void;
  onDeleteRequest: () => void;
}) {
  const isLab = line.lineType === "lab_fee";
  if (!canEdit) {
    return (
      <li className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-2 text-sm">
        <span className="font-medium text-neutral-900">{line.label}</span>
        <span className="text-[#6A0000]">₱{parseFloat(line.amount || "0").toFixed(2)}</span>
      </li>
    );
  }
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-100 bg-white p-2">
      <Input
        defaultValue={line.label}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v && v !== line.label) onUpdate({ label: v });
        }}
        className={`${inputClass} max-w-[200px]`}
        disabled={pending}
        placeholder="Label"
      />
      <span className="text-neutral-400">·</span>
      <div className="flex items-center gap-1">
        <span className="text-sm text-neutral-500">₱</span>
        <Input
          type="number"
          step="0.01"
          min="0"
          defaultValue={line.amount || "0"}
          onBlur={(e) => {
            const v = e.target.value.trim() || "0";
            if (v !== (line.amount || "0")) onUpdate({ amount: v });
          }}
          className={`${inputClass} w-24`}
          disabled={pending}
        />
      </div>
      {isLab && (
        <span className="text-xs text-neutral-500">per lab course</span>
      )}
      <button
        type="button"
        onClick={onDeleteRequest}
        disabled={pending}
        className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export function FeeSetupEditor({
  feeSetupId,
  setup,
  lines,
  approval,
  programs,
  schoolYears,
  terms,
  totals,
  totalUnits,
  totalUnitsFromCurriculum = false,
}: {
  feeSetupId: string;
  setup: Setup;
  lines: Line[];
  approval: Approval;
  programs: { id: string; code: string; name: string }[];
  schoolYears: { id: string; name: string }[];
  terms: { id: string; name: string }[];
  totals: Totals;
  totalUnits: number;
  totalUnitsFromCurriculum?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [tuitionPerUnit, setTuitionPerUnit] = useState(
    setup.tuitionPerUnit ?? "0"
  );
  const canEdit = setup.status === "draft" || setup.status === "rejected";

  async function handleSubmitForApproval() {
    setPending(true);
    const r = await submitFeeSetupForApproval(feeSetupId);
    setPending(false);
    if (r?.error) alert(r.error);
    else router.refresh();
  }

  async function handleSeedDefaults() {
    setPending(true);
    await seedDefaultMiscLines(feeSetupId);
    setPending(false);
    router.refresh();
  }

  async function handleAddLine(
    lineType: "lab_fee" | "misc_fee" | "other_fee",
    label: string,
    amount: string
  ) {
    setPending(true);
    await addFeeSetupLineAction({
      feeSetupId,
      lineType,
      label: label || "New line",
      amount: amount || "0",
      sortOrder: lines.length,
    });
    setPending(false);
    router.refresh();
  }

  async function handleUpdateLine(
    lineId: string,
    updates: { label?: string; amount?: string }
  ) {
    setPending(true);
    await updateFeeSetupLineAction(lineId, updates, feeSetupId);
    setPending(false);
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setPending(true);
    await deleteFeeSetupLineAction(deleteTarget.id, feeSetupId);
    setPending(false);
    setDeleteTarget(null);
    router.refresh();
  }

  async function handleScopeChange(updates: {
    programId?: string;
    yearLevel?: string | null;
    schoolYearId?: string | null;
    termId?: string | null;
  }) {
    if (!canEdit) return;
    setPending(true);
    const r = await updateFeeSetupDraft(feeSetupId, updates);
    setPending(false);
    if (r?.error) alert(r.error);
    else router.refresh();
  }

  const labLines = lines.filter((l) => l.lineType === "lab_fee");
  const miscLines = lines.filter((l) => l.lineType === "misc_fee");
  const otherLines = lines.filter((l) => l.lineType === "other_fee");

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#6A0000]">Scope</h2>
          <p className="mt-0.5 text-xs text-neutral-600">Program, year, school year, and term determine which curriculum units are used for tuition.</p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className="text-xs font-medium text-neutral-600">Program</Label>
            <select
              className={selectClass}
              defaultValue={setup.programId ?? ""}
              disabled={!canEdit || pending}
              onChange={(e) => {
                const v = e.target.value || null;
                handleScopeChange({ programId: v ?? undefined });
              }}
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} – {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium text-neutral-600">Year level</Label>
            <select
              className={selectClass}
              defaultValue={setup.yearLevel ?? ""}
              disabled={!canEdit || pending}
              onChange={(e) => {
                const v = e.target.value || null;
                handleScopeChange({ yearLevel: v });
              }}
            >
              <option value="">All</option>
              {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium text-neutral-600">School year</Label>
            <select
              className={selectClass}
              defaultValue={setup.schoolYearId ?? ""}
              disabled={!canEdit || pending}
              onChange={(e) => {
                const v = e.target.value || null;
                handleScopeChange({ schoolYearId: v, termId: null });
              }}
            >
              <option value="">Any</option>
              {schoolYears.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-medium text-neutral-600">Term</Label>
            <select
              className={selectClass}
              defaultValue={setup.termId ?? ""}
              disabled={!canEdit || pending}
              onChange={(e) => {
                const v = e.target.value || null;
                handleScopeChange({ termId: v });
              }}
            >
              <option value="">Any</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#6A0000]">Tuition</h2>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <Label className="text-xs font-medium text-neutral-600">Tuition per unit (₱)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={tuitionPerUnit}
                onChange={(e) => setTuitionPerUnit(e.target.value)}
                disabled={!canEdit}
                className={`${inputClass} mt-1 w-40`}
              />
            </div>
            <p className="text-sm text-neutral-600">
              Total units: <span className="font-medium text-neutral-900">{totalUnits}</span>{" "}
              {totalUnitsFromCurriculum
                ? "(from published curriculum — tuition = units × per unit)"
                : "(set scope above to pull from published curriculum)"}
            </p>
          </div>
        </div>
      </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-row items-center justify-between border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-[#6A0000]">Lab fees</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Amount is charged per lab course (× number of subjects with lab in curriculum).</p>
          </div>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="border-[#6A0000]/40 text-[#6A0000] hover:bg-[#6A0000]/10"
              onClick={() => handleAddLine("lab_fee", "Laboratory Fee", "0")}
              disabled={pending}
            >
              Add line
            </Button>
          )}
        </div>
        <div className="p-4">
          {labLines.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 py-6 text-center text-sm text-neutral-500">
              No lab fee lines.
            </p>
          ) : (
            <ul className="space-y-2">
              {labLines.map((l) => (
                <FeeLineRow
                  key={l.id}
                  line={l}
                  canEdit={canEdit}
                  pending={pending}
                  onUpdate={(updates) => handleUpdateLine(l.id, updates)}
                  onDeleteRequest={() => setDeleteTarget({ id: l.id, label: l.label })}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#6A0000]">Miscellaneous & other fees</h2>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                onClick={handleSeedDefaults}
                disabled={pending}
              >
                Seed defaults
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-[#6A0000]/40 text-[#6A0000] hover:bg-[#6A0000]/10"
                onClick={() => handleAddLine("misc_fee", "Misc Fee", "0")}
                disabled={pending}
              >
                Add misc
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-[#6A0000]/40 text-[#6A0000] hover:bg-[#6A0000]/10"
                onClick={() => handleAddLine("other_fee", "Other Fee", "0")}
                disabled={pending}
              >
                Add other
              </Button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Label</th>
                <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">Type</th>
                <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">Amount</th>
                {canEdit && <th className="w-10 pb-2" />}
              </tr>
            </thead>
            <tbody>
              {[...miscLines, ...otherLines].map((l) => (
                <tr key={l.id} className="border-b border-neutral-100">
                  <td className="py-2.5">
                    {canEdit ? (
                      <Input
                        defaultValue={l.label}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && v !== l.label) handleUpdateLine(l.id, { label: v });
                        }}
                        className={`${inputClass} max-w-[220px]`}
                        disabled={pending}
                      />
                    ) : (
                      <span className="font-medium text-neutral-900">{l.label}</span>
                    )}
                  </td>
                  <td className="py-2.5 capitalize text-neutral-600">{l.lineType.replace("_", " ")}</td>
                  <td className="py-2.5 text-right">
                    {canEdit ? (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={l.amount || "0"}
                        onBlur={(e) => {
                          const v = e.target.value.trim() || "0";
                          if (v !== (l.amount || "0")) handleUpdateLine(l.id, { amount: v });
                        }}
                        className={`${inputClass} ml-auto w-24 text-right`}
                        disabled={pending}
                      />
                    ) : (
                      <span className="font-medium text-[#6A0000]">₱{parseFloat(l.amount || "0").toFixed(2)}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="py-2.5">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: l.id, label: l.label })}
                        disabled={pending}
                        className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {miscLines.length === 0 && otherLines.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 4 : 3} className="py-8 text-center text-sm text-neutral-500">
                    No misc/other fee lines.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#6A0000]">Summary</h2>
          <p className="mt-0.5 text-xs text-neutral-600">Preview of totals used when generating assessments.</p>
        </div>
        <div className="space-y-2 p-4">
          <div className="flex justify-between text-sm text-neutral-700">
            <span>Tuition ({totalUnits} × ₱{tuitionPerUnit})</span>
            <span className="font-medium text-neutral-900">₱{totals.tuitionAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-700">
            <span>Lab total</span>
            <span className="font-medium text-neutral-900">₱{totals.labTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-700">
            <span>Misc & other total</span>
            <span className="font-medium text-neutral-900">₱{(totals.miscTotal + totals.otherTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-[#6A0000]">
            <span>Total fees</span>
            <span>₱{totals.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {canEdit && setup.status === "draft" && (
        <div className="flex gap-3">
          <Button
            onClick={handleSubmitForApproval}
            disabled={pending}
            className="bg-[#6A0000] hover:bg-[#4A0000] text-white"
          >
            Submit for approval
          </Button>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove fee line"
        description="This fee line will be removed from the setup."
        itemLabel={deleteTarget?.label}
        onConfirm={handleConfirmDelete}
        pending={pending}
      />
    </div>
  );
}
