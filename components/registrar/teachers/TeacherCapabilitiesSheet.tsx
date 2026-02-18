"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTeacherCapabilitiesAction } from "@/app/(portal)/registrar/teachers/actions";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
};

type CapabilityRow = {
  id: string;
  subjectCode: string;
  subjectTitle: string;
  capabilityType: string;
  status: string;
  notes: string | null;
};

type GroupedCapabilities = {
  major: CapabilityRow[];
  ge: CapabilityRow[];
  cross: CapabilityRow[];
};

function CapabilityTypeBadge({ type }: { type: string }) {
  if (type === "major_department")
    return <Badge className="bg-neutral-100 text-neutral-800">Major</Badge>;
  if (type === "ge") return <Badge className="bg-blue-100 text-blue-800">GE</Badge>;
  return <Badge className="bg-amber-100 text-amber-800">Cross</Badge>;
}

export function TeacherCapabilitiesSheet({
  teacher,
  open,
  onOpenChange,
}: {
  teacher: Teacher;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [capabilities, setCapabilities] = useState<GroupedCapabilities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !teacher.id) return;
    setLoading(true);
    getTeacherCapabilitiesAction(teacher.id).then((res) => {
      setCapabilities(res.capabilities ?? null);
      setLoading(false);
    });
  }, [open, teacher.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#6A0000]">
            Capabilities – {teacher.firstName} {teacher.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-neutral-600">Loading…</p>
          ) : !capabilities ? (
            <p className="text-sm text-neutral-600">Failed to load capabilities.</p>
          ) : (
            <div className="space-y-6">
              <CapabilityGroup
                title="Major (Department)"
                rows={capabilities.major}
                emptyMsg="No major subject capabilities."
              />
              <CapabilityGroup
                title="GE"
                rows={capabilities.ge}
                emptyMsg="No GE capabilities."
              />
              <CapabilityGroup
                title="Cross-Department"
                rows={capabilities.cross}
                emptyMsg="No cross-department capabilities."
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CapabilityGroup({
  title,
  rows,
  emptyMsg,
}: {
  title: string;
  rows: CapabilityRow[];
  emptyMsg: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#6A0000]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-neutral-500">{emptyMsg}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="border-b bg-neutral-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-neutral-700">Code</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-700">Title</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-700">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-neutral-50">
                    <td className="px-3 py-2 font-mono text-xs">{r.subjectCode}</td>
                    <td className="px-3 py-2">{r.subjectTitle}</td>
                    <td className="px-3 py-2">
                      <CapabilityTypeBadge type={r.capabilityType} />
                    </td>
                    <td className="px-3 py-2 text-neutral-600 text-xs">{r.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
