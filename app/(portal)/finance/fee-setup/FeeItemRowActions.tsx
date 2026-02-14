"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import { updateFeeItemAction, toggleFeeItemActiveAction } from "./actions";

type FeeItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  defaultAmount: string | null;
  active: boolean;
};

export function FeeItemRowActions({ feeItem }: { feeItem: FeeItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateFeeItemAction(feeItem.id, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleToggle() {
    setPending(true);
    await toggleFeeItemActiveAction(feeItem.id, !feeItem.active);
    setPending(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded border p-2"
      >
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div>
          <Label htmlFor="code" className="text-xs">Code</Label>
          <Input
            id="code"
            name="code"
            defaultValue={feeItem.code}
            className="h-8 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="name" className="text-xs">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={feeItem.name}
            className="h-8 text-sm"
            required
          />
        </div>
        <div>
          <Label htmlFor="category" className="text-xs">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={feeItem.category}
            required
            className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="tuition">Tuition</option>
            <option value="misc">Misc</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <Label htmlFor="defaultAmount" className="text-xs">Default Amount</Label>
          <Input
            id="defaultAmount"
            name="defaultAmount"
            type="number"
            step="0.01"
            defaultValue={feeItem.defaultAmount ?? ""}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex gap-1">
          <Button type="submit" size="sm" disabled={pending}>
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setEditing(true)}
        className="h-8 gap-1"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={pending}
        className="h-8"
      >
        {feeItem.active ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
