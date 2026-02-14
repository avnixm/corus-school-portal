"use client";

import * as React from "react";
import type { EnrollmentRequirementsSummary } from "@/lib/requirements/enrollmentSummary";

export function RequirementsBadge({
  summary,
}: {
  summary: EnrollmentRequirementsSummary | undefined;
}) {
  const [open, setOpen] = React.useState(false);
  if (!summary) return <span className="text-neutral-500">—</span>;
  const { required, verified, missingNames, unverifiedNames } = summary;
  const blocking = [...missingNames, ...unverifiedNames];
  const complete = required > 0 && verified === required;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          complete
            ? "bg-green-100 text-green-800"
            : blocking.length > 0
            ? "bg-amber-100 text-amber-800"
            : "bg-neutral-100 text-neutral-700"
        }`}
        title={blocking.length > 0 ? `Blocking: ${blocking.join(", ")}` : undefined}
      >
        {verified}/{required} verified
      </button>
      {open && blocking.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border bg-white p-2 shadow-lg">
            <p className="text-xs font-medium text-amber-800">Blocking:</p>
            <ul className="mt-1 list-inside list-disc text-xs text-neutral-700">
              {blocking.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
