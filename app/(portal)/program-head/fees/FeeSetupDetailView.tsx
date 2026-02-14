// path: app/(portal)/program-head/fees/FeeSetupDetailView.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Setup = {
  programCode?: string | null;
  programName?: string | null;
  yearLevel: string | null;
  schoolYearName?: string | null;
  termName?: string | null;
  tuitionPerUnit: string | null;
};

type Line = {
  lineType: string;
  label: string;
  amount: string;
  qty: number;
};

export function FeeSetupDetailView({
  setup,
  lines,
  totals,
  totalUnits,
  approveSlot,
}: {
  setup: Setup;
  lines: Line[];
  totals: { tuitionAmount: number; labTotal: number; miscTotal: number; otherTotal: number; total: number };
  totalUnits: number;
  approveSlot?: React.ReactNode;
}) {
  const labLines = lines.filter((l) => l.lineType === "lab_fee");
  const miscOther = lines.filter(
    (l) => l.lineType === "misc_fee" || l.lineType === "other_fee"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-[#6A0000]">
          {setup.programCode} – {setup.programName}
        </h2>
        {approveSlot}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Header</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Year: {setup.yearLevel ?? "All"} · School Year: {setup.schoolYearName ?? "Any"} ·
            Term: {setup.termName ?? "Any"}
          </p>
          <p>Tuition per unit: ₱{parseFloat(setup.tuitionPerUnit ?? "0").toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lab fees</CardTitle>
        </CardHeader>
        <CardContent>
          {labLines.length === 0 ? (
            <p className="text-sm text-neutral-500">None</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {labLines.map((l, i) => (
                <li key={i}>
                  {l.label} – ₱{parseFloat(l.amount || "0").toFixed(2)}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Misc & other fees</CardTitle>
        </CardHeader>
        <CardContent>
          {miscOther.length === 0 ? (
            <p className="text-sm text-neutral-500">None</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {miscOther.map((l, i) => (
                <li key={i}>
                  {l.label} – ₱{parseFloat(l.amount || "0").toFixed(2)}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Tuition ({totalUnits} × ₱{setup.tuitionPerUnit})</span>
            <span>₱{totals.tuitionAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Lab total</span>
            <span>₱{totals.labTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Misc & other</span>
            <span>₱{(totals.miscTotal + totals.otherTotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>₱{totals.total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
