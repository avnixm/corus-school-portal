"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SuccessToast } from "@/components/ui/success-toast";
import {
  getSubjectsForCurriculumVersionAction,
  addSubjectsToBlockAction,
} from "@/app/(portal)/registrar/curriculum/actions";
import { Loader2, Plus } from "lucide-react";

type SubjectOption = {
  id: string;
  code: string;
  title: string;
  units: string;
  isGe?: boolean;
};

export function AddSubjectsSheet({
  versionId,
  blockId,
  blockExists,
}: {
  versionId: string;
  blockId: string;
  blockExists: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, startLoadTransition] = useTransition();
  const [adding, startAddTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "program" | "ge">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open && versionId) {
      startLoadTransition(async () => {
        const result = await getSubjectsForCurriculumVersionAction(versionId);
        if (result.subjects?.length) {
          const seen = new Set<string>();
          setSubjects(
            result.subjects.filter((s) => {
              const id = String(s?.id ?? "");
              if (!id || seen.has(id)) return false;
              seen.add(id);
              return true;
            }) as SubjectOption[]
          );
        } else {
          setSubjects([]);
        }
      });
    }
  }, [open, versionId]);

  useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setSearch("");
      setFilterType("all");
    }
  }, [open]);

  const filtered = subjects.filter((s) => {
    const matchSearch =
      !search.trim() ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.title && s.title.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      filterType === "all" ||
      (filterType === "ge" && s.isGe) ||
      (filterType === "program" && !s.isGe);
    return matchSearch && matchFilter;
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAdd() {
    if (!blockId || selectedIds.size === 0) return;
    startAddTransition(async () => {
      const items = Array.from(selectedIds).map((subjectId) => ({
        subjectId,
        withLab: false,
        prereqText: null as string | null,
      }));
      const result = await addSubjectsToBlockAction({ blockId, items });
      if (result?.error) {
        alert(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
      const n = "addedCount" in result ? result.addedCount : items.length;
      setSuccessMessage(`Added ${n} subject${n !== 1 ? "s" : ""}`);
    });
  }

  return (
    <>
      {successMessage && (
        <SuccessToast
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
      <Button
        type="button"
        size="sm"
        className="bg-[#6A0000] hover:bg-[#6A0000]/90"
        onClick={() => blockExists && setOpen(true)}
        disabled={!blockExists}
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add Subjects
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-neutral-900">Add subjects</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            <Input
              placeholder="Search by code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
            <div className="flex gap-2">
              {(["all", "program", "ge"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    filterType === t
                      ? "bg-[#6A0000]/15 text-[#6A0000]"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {t === "all" ? "All" : t === "ge" ? "GE" : "Program"}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading subjects…
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto rounded border border-neutral-200">
                <div className="divide-y divide-neutral-200">
                  {filtered.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-neutral-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="h-4 w-4 rounded border-neutral-300 accent-[#6A0000]"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-sm font-medium text-neutral-900">
                          {s.code}
                        </span>
                        <span className="ml-1 text-xs text-neutral-600">
                          {s.units} u
                        </span>
                      </div>
                      <span className="truncate text-sm text-neutral-700">
                        {s.title}
                      </span>
                      {s.isGe ? (
                        <Badge variant="outline" className="shrink-0 text-xs bg-neutral-100">
                          GE
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-xs">
                          Program
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Button
              type="button"
              className="w-full bg-[#6A0000] hover:bg-[#6A0000]/90"
              onClick={handleAdd}
              disabled={selectedIds.size === 0 || adding}
            >
              {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add selected ({selectedIds.size})
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
