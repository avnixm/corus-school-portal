"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function AuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const from = (form.elements.namedItem("from") as HTMLInputElement)?.value ?? "";
    const to = (form.elements.namedItem("to") as HTMLInputElement)?.value ?? "";
    const actor = (form.elements.namedItem("actor") as HTMLInputElement)?.value?.trim() ?? "";
    const action = (form.elements.namedItem("action") as HTMLInputElement)?.value?.trim() ?? "";
    const entity = (form.elements.namedItem("entity") as HTMLInputElement)?.value?.trim() ?? "";
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (actor) p.set("actor", actor);
    if (action) p.set("action", action);
    if (entity) p.set("entity", entity);
    router.push(`/admin/audit?${p.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border bg-white p-4 text-neutral-900">
      <div className="w-full min-w-0 sm:w-[140px]">
        <Label htmlFor="from" className="text-xs font-medium text-neutral-800">From date</Label>
        <Input
          id="from"
          name="from"
          type="date"
          defaultValue={searchParams.get("from") ?? ""}
          className="h-9 w-full sm:w-[140px] text-neutral-900"
        />
      </div>
      <div className="w-full min-w-0 sm:w-[140px]">
        <Label htmlFor="to" className="text-xs font-medium text-neutral-800">To date</Label>
        <Input
          id="to"
          name="to"
          type="date"
          defaultValue={searchParams.get("to") ?? ""}
          className="h-9 w-full sm:w-[140px] text-neutral-900"
        />
      </div>
      <div className="w-full min-w-0 sm:w-[180px]">
        <Label htmlFor="actor" className="text-xs font-medium text-neutral-800">Actor user ID</Label>
        <Input
          id="actor"
          name="actor"
          defaultValue={searchParams.get("actor") ?? ""}
          placeholder="User ID"
          className="h-9 w-full sm:w-[180px] text-neutral-900"
        />
      </div>
      <div className="w-full min-w-0 sm:w-[140px]">
        <Label htmlFor="action" className="text-xs font-medium text-neutral-800">Action</Label>
        <Input
          id="action"
          name="action"
          defaultValue={searchParams.get("action") ?? ""}
          placeholder="e.g. ROLE_CHANGE"
          className="h-9 w-full sm:w-[140px] text-neutral-900"
        />
      </div>
      <div className="w-full min-w-0 sm:w-[140px]">
        <Label htmlFor="entity" className="text-xs font-medium text-neutral-800">Entity type</Label>
        <Input
          id="entity"
          name="entity"
          defaultValue={searchParams.get("entity") ?? ""}
          placeholder="e.g. user_profile"
          className="h-9 w-full sm:w-[140px] text-neutral-900"
        />
      </div>
      <Button type="submit" size="sm">Filter</Button>
    </form>
  );
}
