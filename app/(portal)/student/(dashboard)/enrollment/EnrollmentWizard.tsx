"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createOrUpdateDraftEnrollment } from "./actions";

type Program = { id: string; code: string; name: string };

export function EnrollmentWizard({
  schoolYearName,
  termName,
  programs,
}: {
  schoolYearName: string;
  termName: string;
  programs: Program[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programId, setProgramId] = useState("");
  const [yearLevel, setYearLevel] = useState("");

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

  async function handleSaveDraft() {
    if (!programId || !yearLevel) {
      setError("Please select program and year level.");
      return;
    }
    setError(null);
    setPending(true);
    const formData = new FormData();
    formData.set("programId", programId);
    formData.set("program", programs.find((p) => p.id === programId)?.code ?? "");
    formData.set("yearLevel", yearLevel);
    formData.set("sectionId", "");
    const result = await createOrUpdateDraftEnrollment(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Enrollment draft saved successfully");
    router.refresh();
  }

  return (
    <Card className="border-[#6A0000]/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#6A0000]">Start enrollment</CardTitle>
        <p className="text-sm text-neutral-600">
          Choose your program and year level for {schoolYearName} · {termName}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
          <p className="text-xs font-medium uppercase text-neutral-600">Term</p>
          <p className="font-medium text-[#6A0000]">
            {schoolYearName} · {termName}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800">
              Program <span className="text-red-600">*</span>
            </label>
            <select
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6A0000]/40"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
            >
              <option value="">Select program</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} – {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-800">
              Year level <span className="text-red-600">*</span>
            </label>
            <select
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#6A0000]/40"
              value={yearLevel}
              onChange={(e) => setYearLevel(e.target.value)}
            >
              <option value="">Select year level</option>
              {yearLevels.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Your section will be assigned by your Program Head after approval.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button onClick={handleSaveDraft} disabled={pending}>
          {pending ? "Saving…" : "Save draft & continue to requirements"}
        </Button>
      </CardContent>
    </Card>
  );
}
