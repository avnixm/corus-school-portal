"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteStudent } from "./actions";

export function DeleteStudentButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete student "${studentName}"? This will soft-delete the record.`)) {
      return;
    }
    await deleteStudent(studentId);
    router.push("/registrar/records/students");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      onClick={handleDelete}
      className="gap-2 border-red-600 text-red-600 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
}
