"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateUserPasswordAction } from "./actions";

export function UpdatePasswordButton({
  authUserId,
  userEmail,
}: {
  authUserId: string;
  userEmail: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setPending(true);
    const result = await updateUserPasswordAction(authUserId, password);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setPassword("");
    setConfirm("");
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 gap-1 px-2 text-xs text-neutral-800 hover:text-[#6A0000]"
        title={`Update password for ${userEmail ?? "user"}`}
      >
        <KeyRound className="h-3 w-3" />
        Update password
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPassword(""); setConfirm(""); setError(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <Label htmlFor="new-password">New password *</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-10"
                minLength={8}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm password *</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 h-10"
                minLength={8}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setOpen(false); setPassword(""); setConfirm(""); setError(null); }} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
