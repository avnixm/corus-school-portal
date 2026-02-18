"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { approveCapabilityPackageAction, rejectCapabilityPackageAction } from "../actions";

type Pkg = {
  id: string;
  title: string;
  programCode: string | null;
  programName: string | null;
  schoolYearName: string | null;
  termName: string | null;
  createdByUserId: string;
  submittedAt: Date | string | null;
};

type Line = {
  id: string;
  teacherFirstName: string;
  teacherLastName: string;
  subjectCode: string;
  subjectTitle: string;
  capabilityType: string;
  status: string;
  notes: string | null;
};

function TypeBadge({ type }: { type: string }) {
  if (type === "major_department") return <Badge className="bg-neutral-100 text-neutral-800">Major</Badge>;
  if (type === "ge") return <Badge className="bg-blue-100 text-blue-800">GE</Badge>;
  return <Badge className="bg-amber-100 text-amber-800">Cross</Badge>;
}

export function DeanCapabilityReview({ pkg, lines }: { pkg: Pkg; lines: Line[] }) {
  const router = useRouter();
  const [remarks, setRemarks] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setError(null);
    setPending(true);
    const res = await approveCapabilityPackageAction(pkg.id);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/dean/teacher-capabilities");
    router.refresh();
  }

  async function handleReject() {
    if (!remarks.trim()) {
      setError("Please provide remarks for rejection.");
      return;
    }
    setError(null);
    setPending(true);
    const res = await rejectCapabilityPackageAction(pkg.id, remarks);
    setPending(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/dean/teacher-capabilities");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">{pkg.title}</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Program: {pkg.programCode ?? pkg.programName ?? "—"} •{" "}
          {pkg.schoolYearName ?? "—"} / {pkg.termName ?? "—"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">Capability Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-neutral-50 text-xs font-medium text-[#6A0000]">
                <tr>
                  <th className="px-4 py-2">Teacher</th>
                  <th className="px-4 py-2">Subject</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-b last:border-0">
                    <td className="px-4 py-2">
                      {line.teacherFirstName} {line.teacherLastName}
                    </td>
                    <td className="px-4 py-2">
                      {line.subjectCode} – {line.subjectTitle}
                    </td>
                    <td className="px-4 py-2">
                      <TypeBadge type={line.capabilityType} />
                    </td>
                    <td className="px-4 py-2 text-neutral-600 text-xs">{line.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#6A0000]">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <Label htmlFor="remarks">Remarks (required for rejection)</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks when rejecting..."
              className="mt-1"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApprove} disabled={pending}>
              {pending ? "Processing…" : "Approve"}
            </Button>
            <Button variant="outline" onClick={handleReject} disabled={pending} className="border-red-300 text-red-700 hover:bg-red-50">
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
