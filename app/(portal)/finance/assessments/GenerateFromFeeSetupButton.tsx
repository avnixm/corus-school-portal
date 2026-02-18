// path: app/(portal)/finance/assessments/GenerateFromFeeSetupButton.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { generateAssessmentFromFeeSetupAction } from "./actions";

type EnrollmentOption = {
  id: string;
  studentCode: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  schoolYearName: string;
  termName: string;
  program: string | null;
  yearLevel: string | null;
};

function fullName(r: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(" ");
}

export function GenerateFromFeeSetupButton({
  enrollments,
}: {
  enrollments: EnrollmentOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<"installment" | "full">("installment");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!enrollmentId) {
      setError("Select an enrollment");
      return;
    }
    startTransition(async () => {
      const result = await generateAssessmentFromFeeSetupAction(enrollmentId, undefined, paymentPlan);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setEnrollmentId("");
      router.refresh();
      if (result?.assessmentId) {
        router.push(`/finance/assessments/${result.assessmentId}/form`);
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        Generate from Fee Setup
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEnrollmentId("");
            setPaymentPlan("installment");
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Assessment from Fee Setup</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-neutral-600">
              Uses the best matching approved fee setup (Program Head + Dean approved) for the selected enrollment.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="text-sm font-medium">Payment plan</label>
              <div className="mt-1 flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="paymentPlan"
                    value="installment"
                    checked={paymentPlan === "installment"}
                    onChange={() => setPaymentPlan("installment")}
                    className="h-4 w-4"
                  />
                  Installment (no discount)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="paymentPlan"
                    value="full"
                    checked={paymentPlan === "full"}
                    onChange={() => setPaymentPlan("full")}
                    className="h-4 w-4"
                  />
                  Full payment (10% off tuition & lab)
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Enrollment *</label>
              <select
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                required
                className="mt-1 flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select enrollment</option>
                {enrollments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.studentCode} – {fullName(e)} – {e.schoolYearName} / {e.termName}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending || enrollments.length === 0}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {pending ? "Generating…" : "Generate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
