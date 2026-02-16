"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteUserAction } from "./actions";

export function DeleteUserButton({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string | null;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setPending(true);
    const result = await deleteUserAction(userId);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setShowConfirm(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="h-7 gap-1 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
        title={`Delete user ${userEmail ?? userId}`}
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </Button>
      
      {showConfirm && (
        <ConfirmDialog
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Delete User"
          description={`Are you sure you want to delete this user? This will permanently remove their account, profile, and all associated data.`}
          itemLabel={userEmail || userId}
          confirmLabel="Delete User"
          variant="destructive"
          icon={Trash2}
          onConfirm={handleDelete}
          pending={pending}
        />
      )}
      
      {error && (
        <div className="fixed bottom-4 right-4 max-w-md rounded-lg border border-red-300 bg-red-50 p-4 shadow-lg">
          <p className="text-sm font-medium text-red-900">Error</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </>
  );
}
