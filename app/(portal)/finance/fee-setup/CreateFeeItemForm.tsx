"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createFeeItemAction } from "./actions";

export function CreateFeeItemForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createFeeItemAction(formData);
    setPending(false);
    if (result && "error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Fee Item
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border bg-white p-4 shadow-sm"
    >
      <h3 className="font-semibold text-[#6A0000]">Create Fee Item</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <Label htmlFor="code">Code *</Label>
          <Input id="code" name="code" required placeholder="e.g. TUITION" />
        </div>
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required placeholder="e.g. Tuition Fee" />
        </div>
        <div>
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            name="category"
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="tuition">Tuition</option>
            <option value="misc">Misc</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <Label htmlFor="defaultAmount">Default Amount</Label>
          <Input
            id="defaultAmount"
            name="defaultAmount"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          Create
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
