"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SubmitToDeanDialog({
  open,
  onOpenChange,
  packageId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageId: string;
  onSuccess: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!packageId) return;
    setError(null);
    setPending(true);
    const { detectCapabilityIssuesAction } = await import("@/app/(portal)/program-head/teacher-capabilities/actions");
    const issuesRes = await detectCapabilityIssuesAction(packageId);
    if (issuesRes.issues && issuesRes.issues.length > 0) {
      setError("Resolve all issues before submitting.");
      setPending(false);
      return;
    }
    const { submitCapabilityPackageAction } = await import("@/app/(portal)/program-head/teacher-capabilities/actions");
    const res = await submitCapabilityPackageAction(packageId);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit to Dean</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-neutral-600">
          Submit this capability package for Dean approval. All capability lines will be reviewed.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Submitting…" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
