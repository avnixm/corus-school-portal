"use client";

import { ClassManagementTable } from "@/app/(portal)/program-head/classes/ClassManagementTable";
import type { ClassManagementRow } from "@/lib/programHead/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Program = { id: string; code: string; name: string };

export function SectionsPageContent({
  classRows,
  programs,
}: {
  classRows: ClassManagementRow[];
  programs: Program[];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-neutral-900">
            Classes ({classRows.length})
          </CardTitle>
          <p className="text-xs text-neutral-600">
            All sections with enrollment, schedules, capacity, and advisers.
          </p>
        </CardHeader>
        <CardContent>
          <ClassManagementTable rows={classRows} programs={programs} />
        </CardContent>
      </Card>
    </div>
  );
}
