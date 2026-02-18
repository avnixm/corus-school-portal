"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ContactSupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isInactive?: boolean;
}

export function ContactSupportDialog({
  open,
  onOpenChange,
  isInactive = false,
}: ContactSupportDialogProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [steps, setSteps] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/support-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: isInactive ? "account_inactive" : "not_authorized",
          email,
          phone,
          message: steps,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to submit support request.");
        return;
      }
      setSuccess(true);
      setEmail("");
      setPhone("");
      setSteps("");
    } catch {
      setError("Failed to submit support request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#6A0000]">Contact Support</DialogTitle>
          <DialogDescription>
            {isInactive
              ? "Please provide your contact information and describe your situation. We'll help restore access to your account."
              : "Please provide your contact information and describe the issue you're experiencing."}
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Support request submitted. An administrator will review it shortly.
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => { setSuccess(false); onOpenChange(false); }}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          <div className="space-y-2">
            <Label htmlFor="support-email" className="text-sm font-medium text-neutral-700">
              Email
            </Label>
            <Input
              id="support-email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-phone" className="text-sm font-medium text-neutral-700">
              Phone Number
            </Label>
            <Input
              id="support-phone"
              type="tel"
              placeholder="+63 9XX XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-steps" className="text-sm font-medium text-neutral-700">
              What steps should we take?
            </Label>
            <Textarea
              id="support-steps"
              placeholder={
                isInactive
                  ? "Please describe why you need your account reactivated and any relevant details..."
                  : "Please describe the issue you're experiencing and what you were trying to do..."
              }
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={4}
              className="resize-none text-sm"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#6A0000] hover:bg-[#6A0000]/90"
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
