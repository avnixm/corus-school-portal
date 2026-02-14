"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CollectionsReportFilters({
  defaultStart,
  defaultEnd,
}: {
  defaultStart: string;
  defaultEnd: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const start = searchParams.get("start") ?? defaultStart;
  const end = searchParams.get("end") ?? defaultEnd;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const startVal = (form.elements.namedItem("start") as HTMLInputElement).value;
    const endVal = (form.elements.namedItem("end") as HTMLInputElement).value;
    const params = new URLSearchParams();
    if (startVal) params.set("start", startVal);
    if (endVal) params.set("end", endVal);
    router.push(`/finance/reports/collections?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4"
    >
      <div>
        <Label htmlFor="start" className="text-xs">
          Start Date
        </Label>
        <input
          id="start"
          name="start"
          type="date"
          defaultValue={start}
          className="ml-2 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
        />
      </div>
      <div>
        <Label htmlFor="end" className="text-xs">
          End Date
        </Label>
        <input
          id="end"
          name="end"
          type="date"
          defaultValue={end}
          className="ml-2 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
        />
      </div>
      <Button type="submit" size="sm">
        Apply
      </Button>
    </form>
  );
}
