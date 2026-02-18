"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSettingsAction, fetchGradingPeriodsForTermAction } from "./actions";

type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string; schoolYearId: string };
type GradingPeriod = { name: string; sort_order: number };

export function SettingsForm({
  schoolYears,
  terms,
  activeSchoolYearId,
  activeTermId,
  passThreshold,
  maxSectionSize,
  gradingPeriods,
}: {
  schoolYears: SchoolYear[];
  terms: Term[];
  activeSchoolYearId: string;
  activeTermId: string;
  passThreshold: number;
  maxSectionSize: number;
  gradingPeriods: GradingPeriod[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syId, setSyId] = useState(activeSchoolYearId);
  const [termId, setTermId] = useState(activeTermId);
  const [pass, setPass] = useState(String(passThreshold));
  const [maxSection, setMaxSection] = useState(String(maxSectionSize));
  const [periods, setPeriods] = useState<GradingPeriod[]>(gradingPeriods);

  useEffect(() => {
    setPeriods(gradingPeriods);
  }, [gradingPeriods]);

  useEffect(() => {
    if (syId && termId) {
      fetchGradingPeriodsForTermAction(syId, termId).then((res) => {
        if (!res.error) setPeriods(res.periods);
      });
    } else {
      setPeriods([]);
    }
  }, [syId, termId]);

  async function handleSave() {
    setError(null);
    setPending(true);
    try {
      const res = await saveSettingsAction({
        activeSchoolYearId: syId || "",
        activeTermId: termId || "",
        passThreshold: Number(pass) || 75,
        maxSectionSize: Number(maxSection) || 50,
        gradingPeriods: periods,
      });
      if (res?.error) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setPending(false);
    }
  }

  const termsForSy = syId ? terms.filter((t) => t.schoolYearId === syId) : terms;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="sy">Active School Year</Label>
          <select
            id="sy"
            value={syId}
            onChange={(e) => {
              setSyId(e.target.value);
              setTermId("");
            }}
            className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
          >
            <option value="">— Select —</option>
            {schoolYears.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="term">Active Term</Label>
          <select
            id="term"
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="mt-1 flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm"
          >
            <option value="">— Select —</option>
            {termsForSy.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="pass">Pass threshold (default 75)</Label>
          <Input
            id="pass"
            type="number"
            min={0}
            max={100}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="mt-1 max-w-[120px]"
          />
        </div>
        <div>
          <Label htmlFor="maxSection">Max section size</Label>
          <Input
            id="maxSection"
            type="number"
            min={1}
            value={maxSection}
            onChange={(e) => setMaxSection(e.target.value)}
            className="mt-1 max-w-[120px]"
          />
        </div>
      </div>

      <div>
        <Label>Grading periods (name, sort order)</Label>
        <div className="mt-2 space-y-2">
          {periods.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={p.name}
                onChange={(e) => {
                  const next = [...periods];
                  next[i] = { ...next[i], name: e.target.value };
                  setPeriods(next);
                }}
                placeholder="Name"
                className="max-w-[180px]"
              />
              <Input
                type="number"
                value={p.sort_order}
                onChange={(e) => {
                  const next = [...periods];
                  next[i] = { ...next[i], sort_order: Number(e.target.value) || 0 };
                  setPeriods(next);
                }}
                placeholder="Order"
                className="max-w-[80px]"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPeriods([...periods, { name: "", sort_order: periods.length + 1 }])}
          >
            Add period
          </Button>
        </div>
      </div>

      <Button onClick={handleSave} disabled={pending}>
        Save settings
      </Button>
    </div>
  );
}
