"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
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

  if (!open) {
    return (
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
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded border border-neutral-200 bg-white p-2 shadow-sm"
    >
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 placeholder:text-neutral-700"
        autoFocus
        minLength={8}
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 placeholder:text-neutral-700"
        minLength={8}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending} className="h-7 text-xs">
          {pending ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setPassword("");
            setConfirm("");
            setError(null);
          }}
          className="h-7 text-xs"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
