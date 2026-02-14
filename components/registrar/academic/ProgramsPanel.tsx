"use client";

import { useState, useMemo } from "react";
import { Search, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyStatePrograms } from "./EmptyState";
import { RowActionsMenu } from "./RowActionsMenu";
import {
  deleteProgramAction,
} from "@/app/(portal)/registrar/academic/actions";
import { useRouter } from "next/navigation";

type Program = { id: string; code: string; name: string; active: boolean };

export function ProgramsPanel({
  programs,
  selectedId,
  onSelect,
  onAddProgram,
  onEditProgram,
}: {
  programs: Program[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddProgram: () => void;
  onEditProgram: (program: Program) => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return programs;
    const q = search.trim().toLowerCase();
    return programs.filter(
      (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }, [programs, search]);

  async function handleDelete(program: Program) {
    await deleteProgramAction(program.id);
    if (selectedId === program.id) onSelect(null);
    router.refresh();
  }

  if (programs.length === 0) {
    return (
      <Card className="rounded-2xl border border-neutral-200 shadow-sm">
        <CardContent className="p-0">
          <EmptyStatePrograms onAdd={onAddProgram} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-neutral-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900">
          <GraduationCap className="h-5 w-5 text-[#6A0000]" />
          Programs
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search programs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 rounded-md border-neutral-200"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1">
          {filtered.map((p) => (
            <li key={p.id}>
              <div
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 transition-colors ${
                  selectedId === p.id
                    ? "ring-1 ring-[#6A0000]/30 bg-[#6A0000]/5"
                    : "hover:bg-neutral-50"
                }`}
                onClick={() => onSelect(p.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-neutral-900">{p.code}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        p.active ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="truncate text-xs text-neutral-600">{p.name}</p>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <RowActionsMenu
                    item={p}
                    itemLabel="program"
                    onEdit={onEditProgram}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && search && (
          <p className="py-4 text-center text-sm text-neutral-500">No programs match your search.</p>
        )}
      </CardContent>
    </Card>
  );
}
