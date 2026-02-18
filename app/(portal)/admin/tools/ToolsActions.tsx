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
    try {
      const result = await createDefaultGradingPeriodsAction();
      if (result?.error) setError(result.error);
      else setMessage(result?.message ?? "Done");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create grading periods.";
      setError(message);
    } finally {
      setPending(null);
    }
  }

  async function runSeedFees() {
    setError(null);
    setMessage(null);
    setPending("fees");
    try {
      const result = await createDefaultFeeItemsAction();
      if (result?.error) setError(result.error);
      else setMessage(result?.message ?? "Done");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create fee items.";
      setError(message);
    } finally {
      setPending(null);
    }
  }

  async function runRecompute() {
    setError(null);
    setMessage(null);
    setPending("recompute");
    try {
      const result = await recomputeEnrollmentBalancesAction();
      if (result?.error) setError(result.error);
      else setMessage(result?.message ?? "Done");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to recompute balances.";
      setError(message);
    } finally {
      setPending(null);
    }
  }

  async function runImport() {
    setError(null);
    setMessage(null);
    setPending("import");
    try {
      const result = await placeholderImportAction();
      if (result?.error) setError(result.error);
      else setMessage(result?.message ?? "Done");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run import.";
      setError(message);
    } finally {
      setPending(null);
    }
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
