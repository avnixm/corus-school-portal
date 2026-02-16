"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Send } from "lucide-react";
import {
  listCapabilityPackagesAction,
  createCapabilityPackageAction,
  listCapabilityLinesAction,
  submitCapabilityPackageAction,
  detectCapabilityIssuesAction,
} from "./actions";
import { PackageSelector } from "@/components/program-head/capabilities/PackageSelector";
import { CapabilitiesTable } from "@/components/program-head/capabilities/CapabilitiesTable";
import { AddCapabilitiesSheet } from "@/components/program-head/capabilities/AddCapabilitiesSheet";
import { SubmitToDeanDialog } from "@/components/program-head/capabilities/SubmitToDeanDialog";
import { IssuesPanel } from "@/components/program-head/capabilities/IssuesPanel";

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };
type Term = { id: string; name: string; schoolYearId: string };
type Package = {
  id: string;
  title: string;
  status: string;
  programCode: string | null;
  schoolYearName: string | null;
  termName: string | null;
};
type Line = {
  id: string;
  teacherId: string;
  subjectId: string;
  teacherFirstName: string;
  teacherLastName: string;
  teacherDepartmentProgramId: string | null;
  subjectCode: string;
  subjectTitle: string;
  capabilityType: string;
  status: string;
  notes: string | null;
};

export function TeacherCapabilitiesClient({
  programs,
  schoolYears,
  terms,
}: {
  programs: Program[];
  schoolYears: SchoolYear[];
  terms: Term[];
}) {
  const router = useRouter();
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [schoolYearId, setSchoolYearId] = useState("");
  const [termId, setTermId] = useState("");
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [issues, setIssues] = useState<{ type: string; message: string }[]>([]);

  const loadPackages = useCallback(async () => {
    if (!programId) return;
    setLoading(true);
    const res = await listCapabilityPackagesAction({
      programId,
      schoolYearId: schoolYearId || null,
      termId: termId || null,
    });
    setLoading(false);
    if (res.packages) setPackages(res.packages);
  }, [programId, schoolYearId, termId]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const loadLines = useCallback(async () => {
    if (!selectedPackageId) {
      setLines([]);
      return;
    }
    setLoading(true);
    const res = await listCapabilityLinesAction(selectedPackageId);
    setLoading(false);
    if (res.lines) setLines(res.lines);
  }, [selectedPackageId]);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const isDraft = selectedPackage?.status === "draft";
  const filteredTerms = schoolYearId
    ? terms.filter((t) => t.schoolYearId === schoolYearId)
    : terms;

  async function handleNewPackage() {
    if (!programId) return;
    const res = await createCapabilityPackageAction({
      programId,
      schoolYearId: schoolYearId || null,
      termId: termId || null,
      title: `Capabilities ${programs.find((p) => p.id === programId)?.code ?? ""} ${schoolYears.find((s) => s.id === schoolYearId)?.name ?? ""} ${terms.find((t) => t.id === termId)?.name ?? ""}`.trim(),
    });
    if (res.success && res.packageId) {
      setSelectedPackageId(res.packageId);
      router.refresh();
      loadPackages();
    }
  }

  async function handleCheckIssues() {
    if (!selectedPackageId) return;
    const res = await detectCapabilityIssuesAction(selectedPackageId);
    if (res.issues) setIssues(res.issues.map((i) => ({ type: i.type, message: i.message })));
  }

  useEffect(() => {
    if (selectedPackageId && isDraft) {
      detectCapabilityIssuesAction(selectedPackageId).then((res) => {
        if (res.issues) setIssues(res.issues.map((i) => ({ type: i.type, message: i.message })));
      });
    } else {
      setIssues([]);
    }
  }, [selectedPackageId, isDraft, lines.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-xs text-neutral-600">Program</label>
          <select
            value={programId}
            onChange={(e) => {
              setProgramId(e.target.value);
              setSelectedPackageId("");
            }}
            className="ml-2 mt-0.5 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.code}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-neutral-600">School Year</label>
          <select
            value={schoolYearId}
            onChange={(e) => {
              setSchoolYearId(e.target.value);
              setTermId("");
              setSelectedPackageId("");
            }}
            className="ml-2 mt-0.5 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
          >
            <option value="">—</option>
            {schoolYears.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-neutral-600">Term</label>
          <select
            value={termId}
            onChange={(e) => {
              setTermId(e.target.value);
              setSelectedPackageId("");
            }}
            className="ml-2 mt-0.5 h-9 rounded-md border border-neutral-200 px-3 py-1 text-sm"
          >
            <option value="">—</option>
            {filteredTerms.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <PackageSelector
          packages={packages}
          value={selectedPackageId}
          onChange={setSelectedPackageId}
        />
        <Button size="sm" variant="outline" onClick={handleNewPackage} className="self-end">
          New Package
        </Button>
      </div>

      {issues.length > 0 && isDraft && (
        <IssuesPanel issues={issues} onRefresh={handleCheckIssues} />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-[#6A0000]">
            Capability Lines
          </CardTitle>
          {selectedPackageId && (
            <div className="flex gap-2">
              {isDraft && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setAddSheetOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Capabilities
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setSubmitDialogOpen(true)}
                    disabled={lines.length === 0 || issues.length > 0}
                  >
                    <Send className="mr-1.5 h-4 w-4" />
                    Submit to Dean
                  </Button>
                </>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!selectedPackageId ? (
            <p className="py-8 text-center text-sm text-neutral-600">
              Select or create a package to manage capabilities.
            </p>
          ) : loading ? (
            <p className="py-8 text-center text-sm text-neutral-600">Loading…</p>
          ) : (
            <CapabilitiesTable
              lines={lines}
              packageStatus={selectedPackage?.status ?? "draft"}
              onRemove={loadLines}
              onUpdateNote={loadLines}
            />
          )}
        </CardContent>
      </Card>

      <AddCapabilitiesSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        packageId={selectedPackageId}
        programId={programId}
        onSuccess={() => {
          setAddSheetOpen(false);
          loadLines();
          router.refresh();
        }}
      />

      <SubmitToDeanDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        packageId={selectedPackageId}
        onSuccess={() => {
          setSubmitDialogOpen(false);
          loadPackages();
          loadLines();
          router.refresh();
        }}
      />
    </div>
  );
}
