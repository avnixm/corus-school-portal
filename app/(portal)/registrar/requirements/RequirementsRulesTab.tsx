"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRuleAction, deleteRuleAction, updateRuleAction } from "./actions";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import type { requirements } from "@/db/schema";
import type { schoolYears } from "@/db/schema";
import type { terms } from "@/db/schema";

type RequirementRow = typeof requirements.$inferSelect;
type SchoolYearRow = typeof schoolYears.$inferSelect;
type TermRow = typeof terms.$inferSelect;

type RuleRow = {
  id: string;
  requirementId: string;
  requirementCode: string;
  requirementName: string;
  appliesTo: string;
  program: string | null;
  yearLevel: string | null;
  schoolYearId: string | null;
  termId: string | null;
  isRequired: boolean;
  sortOrder: number;
};

function yearLevelLabel(yl: string | null): string {
  if (!yl) return "—";
  const labels: Record<string, string> = {
    "1": "1st year (1st enrollment)",
    "2": "2nd year",
    "3": "3rd year",
    "4": "4th year",
    "5": "5th year",
  };
  return labels[yl] ?? yl;
}

export function RequirementsRulesTab({
  rules,
  requirements: reqs,
  schoolYears,
  terms,
}: {
  rules: RuleRow[];
  requirements: RequirementRow[];
  schoolYears: SchoolYearRow[];
  terms: TermRow[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({
    requirementId: "",
    appliesTo: "enrollment" as "enrollment" | "clearance" | "graduation",
    program: "",
    yearLevel: "",
    schoolYearId: "",
    termId: "",
    isRequired: true,
    sortOrder: rules.length,
  });

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData();
    formData.set("requirementId", newRule.requirementId);
    formData.set("appliesTo", newRule.appliesTo);
    formData.set("program", newRule.program);
    formData.set("yearLevel", newRule.yearLevel);
    formData.set("schoolYearId", newRule.schoolYearId);
    formData.set("termId", newRule.termId);
    formData.set("isRequired", String(newRule.isRequired));
    formData.set("sortOrder", String(newRule.sortOrder));
    const result = await createRuleAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setNewRule((prev) => ({ ...prev, requirementId: "", sortOrder: rules.length + 1 }));
    router.refresh();
  }

  async function handleDeleteRule(id: string) {
    setPending(true);
    await deleteRuleAction(id);
    setPending(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-[#6A0000]">
          Which requirements apply (enrollment / program / year / term)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAddRule} className="flex flex-wrap items-end gap-3 rounded-lg border bg-neutral-50/50 p-4">
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
          <div className="w-48">
            <Label>Requirement</Label>
            <Select
              value={newRule.requirementId}
              onValueChange={(v) => setNewRule((p) => ({ ...p, requirementId: v }))}
              required
            >
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {reqs.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.code} – {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Label>Applies to</Label>
            <Select
              value={newRule.appliesTo}
              onValueChange={(v: "enrollment" | "clearance" | "graduation") =>
                setNewRule((p) => ({ ...p, appliesTo: v }))
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="enrollment">Enrollment</SelectItem>
                <SelectItem value="clearance">Clearance</SelectItem>
                <SelectItem value="graduation">Graduation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-28">
            <Label>Program</Label>
            <Input
              value={newRule.program}
              onChange={(e) => setNewRule((p) => ({ ...p, program: e.target.value }))}
              placeholder="All"
            />
          </div>
          <div className="w-28">
            <Label>Year</Label>
            <Select
              value={newRule.yearLevel || "__all__"}
              onValueChange={(v) => setNewRule((p) => ({ ...p, yearLevel: v === "__all__" ? "" : v }))}
            >
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="1">1st year (1st enrollment only)</SelectItem>
                <SelectItem value="2">2nd year</SelectItem>
                <SelectItem value="3">3rd year</SelectItem>
                <SelectItem value="4">4th year</SelectItem>
                <SelectItem value="5">5th year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <Label>School year</Label>
            <Select
              value={newRule.schoolYearId || "__all__"}
              onValueChange={(v) => setNewRule((p) => ({ ...p, schoolYearId: v === "__all__" ? "" : v }))}
            >
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {schoolYears.map((sy) => (
                  <SelectItem key={sy.id} value={sy.id}>{sy.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-32">
            <Label>Term</Label>
            <Select
              value={newRule.termId || "__all__"}
              onValueChange={(v) => setNewRule((p) => ({ ...p, termId: v === "__all__" ? "" : v }))}
            >
              <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={newRule.isRequired}
                onChange={(e) => setNewRule((p) => ({ ...p, isRequired: e.target.checked }))}
              />
              Required
            </Label>
          </div>
          <Button type="submit" disabled={pending} className="bg-[#6A0000] hover:bg-[#6A0000]/90">
            Add rule
          </Button>
        </form>

        <div className="overflow-hidden rounded-xl border bg-white/80 text-neutral-900">
          <table className="min-w-full text-left text-sm text-neutral-900">
            <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
              <tr>
                <th className="px-4 py-2">Requirement</th>
                <th className="px-4 py-2">Applies to</th>
                <th className="px-4 py-2">Program</th>
                <th className="px-4 py-2">Year</th>
                <th className="px-4 py-2">SY / Term</th>
                <th className="px-4 py-2">Required</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-neutral-50/80">
                  <td className="px-4 py-2">
                    <span className="font-mono text-xs">{r.requirementCode}</span> – {r.requirementName}
                  </td>
                  <td className="px-4 py-2">{r.appliesTo}</td>
                  <td className="px-4 py-2">{r.program ?? "—"}</td>
                  <td className="px-4 py-2">{yearLevelLabel(r.yearLevel)}</td>
                  <td className="px-4 py-2">
                    {r.schoolYearId
                      ? schoolYears.find((sy) => sy.id === r.schoolYearId)?.name ?? "—"
                      : "—"}{" "}
                    / {r.termId ? terms.find((t) => t.id === r.termId)?.name ?? "—" : "—"}
                  </td>
                  <td className="px-4 py-2">{r.isRequired ? "Yes" : "No"}</td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteRule(r.id)}
                      disabled={pending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-800">
                    No rules. Add a rule above to define which requirements apply.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
