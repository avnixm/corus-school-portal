"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [editOpen, setEditOpen] = useState(false);
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
    setEditOpen(false);
    router.refresh();
  }

  async function handleToggle() {
    setPending(true);
    await toggleFeeItemActiveAction(feeItem.id, !feeItem.active);
    setPending(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditOpen(true)}
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fee Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label htmlFor={`edit-code-${feeItem.id}`}>Code *</Label>
              <Input
                id={`edit-code-${feeItem.id}`}
                name="code"
                defaultValue={feeItem.code}
                required
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label htmlFor={`edit-name-${feeItem.id}`}>Name *</Label>
              <Input
                id={`edit-name-${feeItem.id}`}
                name="name"
                defaultValue={feeItem.name}
                required
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label htmlFor={`edit-category-${feeItem.id}`}>Category *</Label>
              <select
                id={`edit-category-${feeItem.id}`}
                name="category"
                defaultValue={feeItem.category}
                required
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="tuition">Tuition</option>
                <option value="misc">Misc</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor={`edit-defaultAmount-${feeItem.id}`}>Default Amount</Label>
              <Input
                id={`edit-defaultAmount-${feeItem.id}`}
                name="defaultAmount"
                type="number"
                step="0.01"
                defaultValue={feeItem.defaultAmount ?? ""}
                className="mt-1 h-10"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
