"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorDialog } from "@/components/ui/ErrorDialog";
import { cloneCurriculumVersionAction } from "@/app/(portal)/registrar/curriculum/actions";
import { useCurriculumBasePath } from "@/lib/registrar/curriculum/CurriculumRouteContext";

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };
type Version = { id: string; name: string; programId: string; schoolYearId: string };

export function CloneVersionDialog({
  sourceVersion,
  programs,
  schoolYears,
  onClose,
}: {
  sourceVersion: Version;
  programs: Program[];
  schoolYears: SchoolYear[];
  onClose: () => void;
}) {
  const basePath = useCurriculumBasePath();
  const [programId, setProgramId] = useState(sourceVersion.programId);
  const [schoolYearId, setSchoolYearId] = useState(sourceVersion.schoolYearId);
  const [name, setName] = useState(`${sourceVersion.name} (Copy)`);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("fromVersionId", sourceVersion.id);
    formData.append("programId", programId);
    formData.append("schoolYearId", schoolYearId);
    formData.append("name", name.trim());

    const result = await cloneCurriculumVersionAction(formData);
    if (result.error) {
      setErrorMessage(result.error);
      setSubmitting(false);
    } else if (result.versionId) {
      window.location.href = `${basePath}?programId=${programId}&schoolYearId=${schoolYearId}&yearLevel=1st%20Year`;
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-[#6A0000]">
            <Copy className="h-5 w-5" />
            Clone curriculum
          </DialogTitle>
          <DialogDescription className="text-neutral-800">
            Create a copy of this curriculum with all its subjects and structure.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program">Target Program</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger id="program">
                <SelectValue placeholder="Select program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-600">Leave as-is to clone within the same program</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolYear">Target School Year</Label>
            <Select value={schoolYearId} onValueChange={setSchoolYearId}>
              <SelectTrigger id="schoolYear">
                <SelectValue placeholder="Select school year" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((sy) => (
                  <SelectItem key={sy.id} value={sy.id}>
                    {sy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">New Version Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for the cloned version"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Cloning..." : "Clone Version"}
            </Button>
          </div>
        </form>
      </DialogContent>
      {errorMessage && (
        <ErrorDialog
          open={!!errorMessage}
          onOpenChange={(open) => !open && setErrorMessage(null)}
          message={errorMessage}
        />
      )}
    </Dialog>
  );
}
