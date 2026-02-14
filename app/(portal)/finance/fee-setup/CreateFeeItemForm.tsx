"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Fee Item
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Fee Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input id="code" name="code" required placeholder="e.g. TUITION" className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required placeholder="e.g. Tuition Fee" className="mt-1 h-10" />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  name="category"
                  required
                  className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="tuition">Tuition</option>
                  <option value="misc">Misc</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="defaultAmount">Default Amount</Label>
                <Input id="defaultAmount" name="defaultAmount" type="number" step="0.01" placeholder="0.00" className="mt-1 h-10" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
              <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
