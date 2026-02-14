"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { TeacherDetailSheet } from "./TeacherDetailSheet";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  position: string | null;
  active: boolean;
  permissionCount: number;
};

export function TeacherTable({ teachers }: { teachers: Teacher[] }) {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  return (
    <>
      <table className="min-w-full text-left text-sm text-neutral-900">
        <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Position</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-center">Authorized Courses</th>
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
              <td className="px-4 py-2 text-neutral-600">{teacher.position || "—"}</td>
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
                  {teacher.permissionCount}
                </Badge>
              </td>
              <td className="px-4 py-2 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTeacher(teacher)}
                >
                  <Eye className="mr-1.5 h-4 w-4" />
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedTeacher && (
        <TeacherDetailSheet
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
        />
      )}
    </>
  );
}
