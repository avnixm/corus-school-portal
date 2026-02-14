"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CollectionsFilters({
  defaultStartDate,
  defaultEndDate,
}: {
  defaultStartDate: string;
  defaultEndDate: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const startDate = (form.elements.namedItem("startDate") as HTMLInputElement)
      ?.value;
    const endDate = (form.elements.namedItem("endDate") as HTMLInputElement)
      ?.value;

    const next = new URLSearchParams(searchParams);
    if (startDate) next.set("startDate", startDate);
    else next.delete("startDate");
    if (endDate) next.set("endDate", endDate);
    else next.delete("endDate");

    router.push(`/finance/reports/collections?${next.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4"
    >
      <div>
        <Label htmlFor="startDate" className="text-xs">
          Start Date
        </Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={defaultStartDate}
          className="h-9"
        />
      </div>
      <div>
        <Label htmlFor="endDate" className="text-xs">
          End Date
        </Label>
        <Input
          id="endDate"
          name="endDate"
          type="date"
          defaultValue={defaultEndDate}
          className="h-9"
        />
      </div>
      <Button type="submit" size="sm">
        Apply
      </Button>
    </form>
  );
}
