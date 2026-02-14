"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setUserActiveAction } from "./actions";

export function SetActiveButton({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const router = useRouter();

  async function handleToggle() {
    const result = await setUserActiveAction(userId, !active);
    if (result?.error) return;
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className="h-7 text-xs"
      onClick={handleToggle}
    >
      {active ? "Active" : "Inactive"}
    </Button>
  );
}
