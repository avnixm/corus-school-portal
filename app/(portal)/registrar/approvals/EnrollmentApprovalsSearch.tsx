"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function EnrollmentApprovalsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const current = searchParams.get("search") ?? "";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("search") as HTMLInputElement)?.value ?? "";
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) {
      params.set("search", q.trim());
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.push(`/registrar/approvals?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1 max-w-xs">
        <Label htmlFor="search" className="sr-only">
          Search by student name or ID
        </Label>
        <Input
          id="search"
          name="search"
          type="search"
          placeholder="Search by name or student no..."
          defaultValue={current}
          className="h-9"
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending} className="gap-2">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </form>
  );
}
