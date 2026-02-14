"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  createDefaultGradingPeriodsAction,
  createDefaultFeeItemsAction,
  recomputeEnrollmentBalancesAction,
  placeholderImportAction,
} from "./actions";

export function ToolsActions({
  variant = "seed",
}: {
  variant?: "seed" | "recompute" | "import";
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSeedGrading() {
    setError(null);
    setMessage(null);
    setPending("grading");
    const result = await createDefaultGradingPeriodsAction();
    setPending(null);
    if (result?.error) setError(result.error);
    else setMessage(result?.message ?? "Done");
    router.refresh();
  }

  async function runSeedFees() {
    setError(null);
    setMessage(null);
    setPending("fees");
    const result = await createDefaultFeeItemsAction();
    setPending(null);
    if (result?.error) setError(result.error);
    else setMessage(result?.message ?? "Done");
    router.refresh();
  }

  async function runRecompute() {
    setError(null);
    setMessage(null);
    setPending("recompute");
    const result = await recomputeEnrollmentBalancesAction();
    setPending(null);
    if (result?.error) setError(result.error);
    else setMessage(result?.message ?? "Done");
    router.refresh();
  }

  async function runImport() {
    setError(null);
    setMessage(null);
    setPending("import");
    const result = await placeholderImportAction();
    setPending(null);
    if (result?.error) setError(result.error);
    else setMessage(result?.message ?? "Done");
    router.refresh();
  }

  if (variant === "seed") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={runSeedGrading}
            disabled={!!pending}
          >
            {pending === "grading" ? "Running…" : "Create default grading periods"}
          </Button>
          <Button
            variant="outline"
            onClick={runSeedFees}
            disabled={!!pending}
          >
            {pending === "fees" ? "Running…" : "Create default fee items"}
          </Button>
        </div>
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (variant === "recompute") {
    return (
      <div className="space-y-4">
        <Button onClick={runRecompute} disabled={!!pending}>
          {pending === "recompute" ? "Running…" : "Recompute enrollment balances"}
        </Button>
        {message && <p className="text-sm text-green-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={runImport} disabled={!!pending}>
        {pending === "import" ? "Running…" : "Run placeholder import"}
      </Button>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
