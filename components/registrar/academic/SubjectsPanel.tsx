"use client";

import { useState, useMemo } from "react";
import { Plus, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubjectTypeBadge } from "./SubjectTypeBadge";
import { EmptyStateSubjects } from "./EmptyState";
import { RowActionsMenu } from "./RowActionsMenu";
import {
  toggleSubjectActiveAction,
  deleteSubjectAction,
} from "@/app/(portal)/registrar/academic/actions";
import { useRouter } from "next/navigation";

type Program = { id: string; code: string; name: string };
type Subject = {
  id: string;
  code: string;
  title?: string;
  description?: string | null;
  units: string | null;
  active: boolean;
  isGe?: boolean;
  programId?: string | null;
  programCode?: string | null;
};

type SortKey = "code" | "title" | "units";

export function SubjectsPanel({
  subjects,
  programs,
  selectedProgramId,
  selectedProgramCode,
  onAddSubject,
  onEditSubject,
}: {
  subjects: Subject[];
  programs: Program[];
  selectedProgramId: string | null;
  selectedProgramCode: string | null;
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [includeGe, setIncludeGe] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("code");
  const [activeTab, setActiveTab] = useState<"program" | "ge">("program");

  const programSubjects = useMemo(
    () => subjects.filter((s) => !s.isGe && s.programId === selectedProgramId),
    [subjects, selectedProgramId]
  );
  const geSubjects = useMemo(() => subjects.filter((s) => s.isGe), [subjects]);
  const combinedForProgram = useMemo(
    () =>
      selectedProgramId
        ? subjects.filter((s) => s.isGe || s.programId === selectedProgramId)
        : geSubjects,
    [subjects, selectedProgramId, geSubjects]
  );

  const filterAndSort = (list: Subject[]) => {
    let out = list;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (s) =>
          s.code.toLowerCase().includes(q) ||
          (s.title ?? s.description ?? "").toLowerCase().includes(q)
      );
    }
    out = [...out].sort((a, b) => {
      if (sortBy === "code") return (a.code ?? "").localeCompare(b.code ?? "");
      if (sortBy === "title")
        return (a.title ?? a.description ?? "").localeCompare(b.title ?? b.description ?? "");
      const uA = parseFloat(String(a.units ?? 0));
      const uB = parseFloat(String(b.units ?? 0));
      return uA - uB;
    });
    return out;
  };

  const programFiltered = filterAndSort(programSubjects);
  const geFiltered = filterAndSort(geSubjects);
  const combinedFiltered = filterAndSort(combinedForProgram);

  async function handleToggleActive(subject: Subject) {
    await toggleSubjectActiveAction(subject.id, !subject.active);
    router.refresh();
  }

  async function handleDelete(subject: Subject) {
    await deleteSubjectAction(subject.id);
    router.refresh();
  }

  const showEmptyProgram = !!selectedProgramId && programSubjects.length === 0;
  const showEmptyGe = geSubjects.length === 0;
  const showEmptyCombined = !selectedProgramId && activeTab === "program";

  return (
    <>
      <Card className="rounded-2xl border border-neutral-200 shadow-sm">
        <CardHeader className="space-y-4 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900">
                <BookOpen className="h-5 w-5 text-[#6A0000]" />
                Subjects
              </CardTitle>
              {selectedProgramCode && (
                <Badge variant="outline" className="font-mono text-xs border-[#6A0000]/40 text-[#6A0000]">
                  {selectedProgramCode}
                </Badge>
              )}
            </div>
            <Button size="sm" className="gap-1.5" onClick={onAddSubject}>
              <Plus className="h-4 w-4" />
              Add Subject
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[160px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search subjects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9 rounded-md border-neutral-200"
              />
            </div>
            {selectedProgramId && (
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={includeGe}
                  onChange={(e) => setIncludeGe(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                Include GE
              </label>
            )}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="h-10 w-[140px] rounded-md border-neutral-200">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="code">Code</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="units">Units</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "program" | "ge")}>
            <TabsList className="rounded-lg border border-neutral-200 bg-neutral-100 p-1">
              <TabsTrigger value="program" className="rounded-md">
                Program Subjects ({programSubjects.length})
              </TabsTrigger>
              <TabsTrigger value="ge" className="rounded-md">
                GE Subjects ({geSubjects.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="program" className="mt-3">
              {showEmptyCombined ? (
                <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/80 py-8 text-center text-sm text-neutral-600">
                  Select a program to view its subjects, or switch to GE Subjects.
                </div>
              ) : showEmptyProgram ? (
                <EmptyStateSubjects onAdd={onAddSubject} />
              ) : (
                <SubjectTable
                  list={includeGe && selectedProgramId ? combinedFiltered : programFiltered}
                  onEdit={onEditSubject}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              )}
            </TabsContent>
            <TabsContent value="ge" className="mt-3">
              {showEmptyGe ? (
                <EmptyStateSubjects onAdd={onAddSubject} />
              ) : (
                <SubjectTable
                  list={geFiltered}
                  onEdit={onEditSubject}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-0">
          {selectedProgramId && (
            <div className="rounded-lg border border-neutral-200 border-l-4 border-l-[#6A0000] bg-white px-3 py-2 text-xs text-neutral-700">
              GE subjects are automatically available to all programs.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function SubjectTable({
  list,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  list: Subject[];
  onEdit: (s: Subject) => void;
  onDelete: (s: Subject) => void | Promise<void>;
  onToggleActive: (s: Subject) => void | Promise<void>;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Units</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr
                key={s.id}
                className="border-b last:border-0 hover:bg-neutral-50/80 transition-colors"
              >
                <td className="px-4 py-2.5 font-mono font-medium text-neutral-900">{s.code}</td>
                <td className="px-4 py-2.5 text-neutral-900">{(s.title ?? s.description) ?? "—"}</td>
                <td className="px-4 py-2.5 text-neutral-700">{s.units ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <SubjectTypeBadge isGe={!!s.isGe} programCode={s.programCode} />
                </td>
                <td className="px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleActive(s)}
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      s.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {s.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <RowActionsMenu
                    item={s}
                    itemLabel="subject"
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && (
        <div className="py-8 text-center text-sm text-neutral-500">No subjects match your filters.</div>
      )}
    </div>
  );
}
