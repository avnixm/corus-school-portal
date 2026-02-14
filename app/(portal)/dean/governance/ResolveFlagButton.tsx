"use client";

import { useTransition } from "react";
import { resolveFlagFormAction } from "./actions";

export function ResolveFlagButton({ flagId }: { flagId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(() => void resolveFlagFormAction(formData));
      }}
      className="inline"
    >
      <input type="hidden" name="flagId" value={flagId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-medium text-[#6A0000] hover:underline disabled:opacity-50"
      >
        {pending ? "Resolving…" : "Resolve"}
      </button>
    </form>
  );
}
