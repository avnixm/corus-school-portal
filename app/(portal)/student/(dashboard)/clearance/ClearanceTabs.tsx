"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, FileCheck } from "lucide-react";
import { getOrCreateClearanceRequestAction } from "./actions";
import { useState } from "react";

type PeriodInfo = {
  id: string;
  name: string;
};

type ClearanceRow = {
  requestId: string;
  enrollmentId: string;
  periodId: string;
  periodName: string;
  schoolYearName: string;
  termName: string;
  status: string;
  items: Array<{
    id: string;
    officeType: string;
    status: string;
    remarks: string | null;
  }>;
};

const OFFICE_LABELS: Record<string, string> = {
  finance: "Finance",
  registrar: "Registrar",
  program_head: "Program Head",
  library: "Library",
  lab: "Computer Lab",
};

export function ClearanceTabs({
  enrollmentId,
  periods,
  clearanceByPeriod,
  schoolYearName,
  termName,
}: {
  enrollmentId: string;
  periods: PeriodInfo[];
  clearanceByPeriod: Map<string, ClearanceRow>;
  schoolYearName: string;
  termName: string;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState<string | null>(null);

  async function handleGenerate(periodId: string) {
    setGenerating(periodId);
    const result = await getOrCreateClearanceRequestAction(enrollmentId, periodId);
    setGenerating(null);
    if (result?.error) return;
    router.refresh();
  }

  return (
    <Tabs defaultValue={periods[0]?.id ?? ""} className="w-full">
      <TabsList className="mb-4 flex h-auto flex-wrap gap-1 bg-neutral-100 p-1">
        {periods.map((p) => (
          <TabsTrigger key={p.id} value={p.id} className="data-[state=active]:bg-white">
            {p.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {periods.map((period) => {
        const row = clearanceByPeriod.get(period.id);
        return (
          <TabsContent key={period.id} value={period.id} className="mt-0">
            {!row ? (
              <div className="rounded-xl border bg-white p-6 text-center">
                <p className="text-sm text-neutral-600">
                  No clearance generated yet for {period.name}.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => handleGenerate(period.id)}
                  disabled={generating === period.id}
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  {generating === period.id ? "Generating…" : "Generate clearance"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-neutral-600">
                    {schoolYearName} · {termName} · {period.name}
                  </p>
                  <Link
                    href={`/student/clearance/${period.id}/print`}
                    className="inline-flex items-center gap-2 rounded-md border border-[#6A0000] bg-white px-3 py-2 text-sm font-medium text-[#6A0000] hover:bg-neutral-50"
                  >
                    <Printer className="h-4 w-4" />
                    Print form
                  </Link>
                </div>

                <div className="rounded-xl border bg-white p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[#6A0000]">
                    Office checklist
                  </h3>
                  <ul className="space-y-2">
                    {row.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 py-2 last:border-0"
                      >
                        <span className="text-sm font-medium text-neutral-800">
                          {OFFICE_LABELS[item.officeType] ?? item.officeType}
                        </span>
                        <Badge
                          variant={
                            item.status === "cleared"
                              ? "default"
                              : item.status === "blocked"
                                ? "destructive"
                                : "secondary"
                          }
                          className={
                            item.status === "cleared"
                              ? "bg-emerald-600"
                              : item.status === "blocked"
                                ? "bg-amber-600"
                                : ""
                          }
                        >
                          {item.status === "cleared"
                            ? "Cleared"
                            : item.status === "blocked"
                              ? "Blocked"
                              : "Pending"}
                        </Badge>
                        {item.remarks && (
                          <span className="w-full text-xs text-neutral-500">
                            {item.remarks}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {row.items.some((i) => i.officeType === "finance" && i.status === "blocked") && (
                    <p className="mt-3 text-xs text-amber-700">
                      Finance is blocking clearance (balance due or hold). You may request a
                      promissory note from the Finance office.
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
