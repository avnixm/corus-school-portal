// path: app/(portal)/finance/fee-setup/FeeSetupEditor.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import {
  createFeeSetupDraft,
  addFeeSetupLineAction,
  updateFeeSetupLineAction,
  deleteFeeSetupLineAction,
  submitFeeSetupForApproval,
  seedDefaultMiscLines,
  cloneFeeSetup,
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
  if (!canEdit) {
    return (
      <li className="flex items-center gap-2 text-sm">
        {line.label} – ₱{parseFloat(line.amount || "0").toFixed(2)}
      </li>
    );
  }
  return (
    <li className="flex flex-wrap items-center gap-2">
      <Input
        defaultValue={line.label}
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (v && v !== line.label) onUpdate({ label: v });
        }}
        className="h-8 max-w-[180px] text-sm"
        disabled={pending}
        placeholder="Label"
      />
      <span className="text-neutral-500">–</span>
      <Input
        type="number"
        step="0.01"
        min="0"
        defaultValue={line.amount || "0"}
        onBlur={(e) => {
          const v = e.target.value.trim() || "0";
          if (v !== (line.amount || "0")) onUpdate({ amount: v });
        }}
        className="h-8 w-24 text-sm"
        disabled={pending}
      />
      <span className="text-sm text-neutral-500">₱</span>
      <button
        type="button"
        onClick={onDeleteRequest}
        disabled={pending}
        className="rounded p-1 text-red-600 hover:bg-red-50"
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

  const labLines = lines.filter((l) => l.lineType === "lab_fee");
  const miscLines = lines.filter((l) => l.lineType === "misc_fee");
  const otherLines = lines.filter((l) => l.lineType === "other_fee");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Header
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Program</Label>
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              defaultValue={setup.programId ?? ""}
              disabled={!canEdit}
            >
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} – {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Year Level</Label>
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              defaultValue={setup.yearLevel ?? ""}
              disabled={!canEdit}
            >
              <option value="">All</option>
              {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"].map(
                (y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <Label>School Year</Label>
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              defaultValue={setup.schoolYearId ?? ""}
              disabled={!canEdit}
            >
              <option value="">Any</option>
              {schoolYears.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Term</Label>
            <select
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              defaultValue={setup.termId ?? ""}
              disabled={!canEdit}
            >
              <option value="">Any</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Tuition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <Label>Tuition per unit (₱)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={tuitionPerUnit}
                onChange={(e) => setTuitionPerUnit(e.target.value)}
                disabled={!canEdit}
                className="mt-1 w-40"
              />
            </div>
            <p className="text-sm text-neutral-600">
              Total units: {totalUnits} (from schedule or manual)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Lab Fees
          </CardTitle>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddLine("lab_fee", "Laboratory Fee", "0")}
              disabled={pending}
            >
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {labLines.length === 0 ? (
            <p className="text-sm text-neutral-500">No lab fee lines.</p>
          ) : (
            <ul className="space-y-3">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Miscellaneous & Other Fees
          </CardTitle>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSeedDefaults}
                disabled={pending}
              >
                Seed defaults
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddLine("misc_fee", "Misc Fee", "0")}
                disabled={pending}
              >
                Add misc
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAddLine("other_fee", "Other Fee", "0")}
                disabled={pending}
              >
                Add other
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Label</th>
                  <th className="py-2 text-left">Type</th>
                  <th className="py-2 text-right">Amount</th>
                  {canEdit && <th className="w-10 py-2" />}
                </tr>
              </thead>
              <tbody>
                {[...miscLines, ...otherLines].map((l) => (
                  <tr key={l.id} className="border-b">
                    <td className="py-2">
                      {canEdit ? (
                        <Input
                          defaultValue={l.label}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v && v !== l.label) handleUpdateLine(l.id, { label: v });
                          }}
                          className="h-8 max-w-[220px] text-sm"
                          disabled={pending}
                        />
                      ) : (
                        l.label
                      )}
                    </td>
                    <td className="py-2 capitalize">{l.lineType.replace("_", " ")}</td>
                    <td className="py-2 text-right">
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
                          className="ml-auto h-8 w-24 text-right text-sm"
                          disabled={pending}
                        />
                      ) : (
                        `₱${parseFloat(l.amount || "0").toFixed(2)}`
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: l.id, label: l.label })}
                          disabled={pending}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
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
                    <td colSpan={canEdit ? 4 : 3} className="py-4 text-center text-neutral-500">
                      No misc/other fee lines.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Summary (preview)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Tuition ({totalUnits} × ₱{tuitionPerUnit})</span>
            <span>₱{totals.tuitionAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Lab total</span>
            <span>₱{totals.labTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Misc & other total</span>
            <span>₱{(totals.miscTotal + totals.otherTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total Fees</span>
            <span>₱{totals.total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {canEdit && setup.status === "draft" && (
        <div className="flex gap-3">
          <Button
            onClick={handleSubmitForApproval}
            disabled={pending}
            className="bg-[#6A0000] hover:bg-[#6A0000]/90"
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
