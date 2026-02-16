"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil } from "lucide-react";
import { EditTeacherDialog } from "./EditTeacherDialog";
import { TeacherCapabilitiesSheet } from "./TeacherCapabilitiesSheet";

type Program = { id: string; code: string; name: string };
type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string | null;
  active: boolean;
  departmentProgramId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  activeCapabilityCount: number;
};

export function TeacherTable({ teachers, programs }: { teachers: Teacher[]; programs: Program[] }) {
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [capabilitiesTeacher, setCapabilitiesTeacher] = useState<Teacher | null>(null);

  return (
    <>
      <table className="min-w-full text-left text-sm text-neutral-900">
        <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Department</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-center">#Active Capabilities</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr
              key={teacher.id}
              className="border-b last:border-0 hover:bg-neutral-50/80"
            >
              <td className="px-4 py-2 font-medium">
                {teacher.firstName} {teacher.lastName}
              </td>
              <td className="px-4 py-2 text-neutral-600">{teacher.email || "—"}</td>
              <td className="px-4 py-2">
                {teacher.departmentCode ? (
                  <Badge variant="outline" className="font-normal">
                    {teacher.departmentCode}
                  </Badge>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-2">
                <Badge
                  variant={teacher.active ? "default" : "outline"}
                  className={teacher.active ? "bg-green-100 text-green-800 border-transparent" : ""}
                >
                  {teacher.active ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="px-4 py-2 text-center">
                <Badge variant="outline" className="font-mono">
                  {teacher.activeCapabilityCount}
                </Badge>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingTeacher(teacher)}
                    title="Edit teacher"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCapabilitiesTeacher(teacher)}
                    title="View capabilities"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    View Capabilities
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingTeacher && (
        <EditTeacherDialog
          teacher={editingTeacher}
          programs={programs}
          open={!!editingTeacher}
          onOpenChange={(open) => !open && setEditingTeacher(null)}
          onSuccess={() => setEditingTeacher(null)}
        />
      )}

      {capabilitiesTeacher && (
        <TeacherCapabilitiesSheet
          teacher={capabilitiesTeacher}
          open={!!capabilitiesTeacher}
          onOpenChange={(open) => !open && setCapabilitiesTeacher(null)}
        />
      )}
    </>
  );
}
