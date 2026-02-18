"use client";

import { formatStatusForDisplay } from "@/lib/formatStatus";

type Package = {
  id: string;
  title: string;
  status: string;
  programCode: string | null;
  schoolYearName: string | null;
  termName: string | null;
};

export function PackageSelector({
  packages,
  value,
  onChange,
}: {
  packages: Package[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-neutral-600">Package</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ml-2 mt-0.5 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
      >
        <option value="">— Select —</option>
        {packages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title} ({statusLabel(p.status)})
          </option>
        ))}
      </select>
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "draft": return "Draft";
    case "submitted": return "Submitted";
    case "approved": return "Approved";
    case "rejected": return "Rejected";
    case "archived": return "Archived";
    default: return formatStatusForDisplay(status);
  }
}
