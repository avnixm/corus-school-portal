"use client";

import { useState } from "react";
import { X, FileText } from "lucide-react";
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
import { createCurriculumVersionAction } from "@/app/(portal)/registrar/curriculum/actions";
import { useCurriculumBasePath } from "@/lib/registrar/curriculum/CurriculumRouteContext";

type Program = { id: string; code: string; name: string };
type SchoolYear = { id: string; name: string };

export function CreateDraftDialog({
  programs,
  schoolYears,
  onClose,
}: {
  programs: Program[];
  schoolYears: SchoolYear[];
  onClose: () => void;
}) {
  const basePath = useCurriculumBasePath();
  const [programId, setProgramId] = useState("");
  const [schoolYearId, setSchoolYearId] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId || !schoolYearId || !name.trim()) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("programId", programId);
    formData.append("schoolYearId", schoolYearId);
    formData.append("name", name.trim());

    const result = await createCurriculumVersionAction(formData);
    if (result.error) {
      setErrorMessage(result.error);
      setSubmitting(false);
    } else if (result.versionId) {
      window.location.href = `${basePath}?programId=${programId}&versionId=${result.versionId}`;
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-[#6A0000]">
            <FileText className="h-5 w-5" />
            Create new curriculum draft
          </DialogTitle>
          <DialogDescription className="text-neutral-800">
            Create a new draft curriculum for a program and school year.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program">Program *</Label>
            <Select value={programId} onValueChange={setProgramId} required>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="schoolYear">School Year *</Label>
            <Select value={schoolYearId} onValueChange={setSchoolYearId} required>
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
            <Label htmlFor="name">Version Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Revised 2024, Version 1.0"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !programId || !schoolYearId || !name.trim()}>
              {submitting ? "Creating..." : "Create Draft"}
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
