"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { AddCoursesDialog } from "./AddCoursesDialog";
import { EditCourseNoteDialog } from "./EditCourseNoteDialog";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { removeTeacherSubjectPermissionAction } from "@/app/(portal)/registrar/teachers/actions";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string | null;
  active: boolean;
};

type Permission = {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectTitle: string;
  units: string | null;
  programId: string | null;
  isGe: boolean;
  canTeach: boolean;
  notes: string | null;
};

export function TeacherDetailSheet({
  teacher,
  onClose,
}: {
  teacher: Teacher;
  onClose: () => void;
}) {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ subjectId: string; subjectCode: string } | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    async function loadPermissions() {
      setLoading(true);
      const res = await fetch(`/api/registrar/teachers/${teacher.id}/permissions`);
      if (res.ok) {
        const data = await res.json();
        setPermissions(data);
      }
      setLoading(false);
    }
    loadPermissions();
  }, [teacher.id]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await removeTeacherSubjectPermissionAction(teacher.id, deleteTarget.subjectId);
    setPending(false);
    if (result?.error) {
      alert(result.error);
    } else {
      setDeleteTarget(null);
      router.refresh();
      // Reload permissions
      const res = await fetch(`/api/registrar/teachers/${teacher.id}/permissions`);
      if (res.ok) {
        const data = await res.json();
        setPermissions(data);
      }
    }
  }

  return (
    <>
      <Sheet open onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold text-[#6A0000]">
              Teacher Details
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Teacher Profile Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#6A0000]">
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-neutral-600">Name:</span>
                  <span className="font-medium">
                    {teacher.firstName} {teacher.lastName}
                  </span>
                  
                  <span className="text-neutral-600">Email:</span>
                  <span>{teacher.email || "—"}</span>
                  
                  <span className="text-neutral-600">Position:</span>
                  <span>{teacher.position || "—"}</span>
                  
                  <span className="text-neutral-600">Status:</span>
                  <Badge
                    variant={teacher.active ? "default" : "outline"}
                    className={teacher.active ? "bg-green-100 text-green-800 border-transparent" : ""}
                  >
                    {teacher.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Authorized Courses Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-[#6A0000]">
                    Authorized Courses
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#6A0000]/40 text-[#6A0000] hover:bg-[#6A0000]/10"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Courses
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-neutral-600">Loading...</p>
                ) : permissions.length === 0 ? (
                  <p className="text-sm text-neutral-600">
                    No courses assigned yet. Click "Add Courses" to get started.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <table className="min-w-full text-sm">
                      <thead className="border-b bg-neutral-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-neutral-700">Code</th>
                          <th className="px-3 py-2 text-left font-medium text-neutral-700">Title</th>
                          <th className="px-3 py-2 text-center font-medium text-neutral-700">Units</th>
                          <th className="px-3 py-2 text-left font-medium text-neutral-700">Type</th>
                          <th className="px-3 py-2 text-left font-medium text-neutral-700">Notes</th>
                          <th className="px-3 py-2 text-center font-medium text-neutral-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.map((perm) => (
                          <tr key={perm.id} className="border-b last:border-0 hover:bg-neutral-50">
                            <td className="px-3 py-2 font-mono text-xs">{perm.subjectCode}</td>
                            <td className="px-3 py-2">{perm.subjectTitle}</td>
                            <td className="px-3 py-2 text-center">{perm.units || "—"}</td>
                            <td className="px-3 py-2">
                              <Badge
                                variant="outline"
                                className={perm.isGe ? "bg-blue-50 text-blue-700" : "bg-neutral-50"}
                              >
                                {perm.isGe ? "GE" : "Program"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-neutral-600 text-xs">
                              {perm.notes ? (
                                <span className="line-clamp-1">{perm.notes}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingPermission(perm)}
                                  className="rounded p-1 hover:bg-neutral-100"
                                  title="Edit note"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-neutral-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget({ subjectId: perm.subjectId, subjectCode: perm.subjectCode })}
                                  className="rounded p-1 hover:bg-red-50"
                                  title="Remove"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {showAddDialog && (
        <AddCoursesDialog
          teacherId={teacher.id}
          existingSubjectIds={permissions.map(p => p.subjectId)}
          onClose={() => {
            setShowAddDialog(false);
            // Reload permissions
            fetch(`/api/registrar/teachers/${teacher.id}/permissions`).then(res => {
              if (res.ok) res.json().then(data => setPermissions(data));
            });
          }}
        />
      )}

      {editingPermission && (
        <EditCourseNoteDialog
          teacherId={teacher.id}
          permission={editingPermission}
          onClose={() => {
            setEditingPermission(null);
            // Reload permissions
            fetch(`/api/registrar/teachers/${teacher.id}/permissions`).then(res => {
              if (res.ok) res.json().then(data => setPermissions(data));
            });
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          itemType="course authorization"
          itemLabel={deleteTarget.subjectCode}
          onConfirm={handleDelete}
          pending={pending}
        />
      )}
    </>
  );
}
