"use client";

import { AlertCircle } from "lucide-react";

export function IssuesPanel({
  issues,
  onRefresh,
}: {
  issues: { type: string; message: string }[];
  onRefresh: () => void;
}) {
  if (issues.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center gap-2 text-amber-800 font-medium">
        <AlertCircle className="h-4 w-4" />
        Issues (resolve before submitting)
      </div>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
        {issues.map((i, idx) => (
          <li key={idx}>{i.message}</li>
        ))}
      </ul>
    </div>
  );
}
