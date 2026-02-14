"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addOrUpdateCurriculumBlockAction,
  removeSubjectFromBlockAction,
  updateBlockSubjectAction,
} from "@/app/(portal)/registrar/curriculum/actions";
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";
import { useMemo } from "react";

type Block = {
  id: string;
  curriculumVersionId: string;
  yearLevel: string;
  termId: string;
  sortOrder: number;
  termName: string | null;
  subjects: Array<{
    id: string;
    subjectId: string;
    code: string;
    title: string | null;
    units: string | null;
    prereqText: string | null;
    withLab: boolean;
    sortOrder: number;
    isGe?: boolean;
  }>;
};

type Term = { id: string; name: string };
type Program = { id: string; code: string; name: string };

type SortKey = "code" | "title" | "units";

export function EditorCard({
  versionId,
  program,
  yearLevel,
  term,
  block,
  isDraft,
}: {
  versionId: string;
  program: Program | null;
  yearLevel: string;
  term: Term;
  block: Block | null;
  isDraft: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [showGe, setShowGe] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("code");

  const subjects = block?.subjects ?? [];
  const filteredSubjects = useMemo(() => {
    let list = subjects.filter((s) => {
      const matchSearch =
        !search.trim() ||
        (s.code?.toLowerCase().includes(search.toLowerCase())) ||
        (s.title?.toLowerCase().includes(search.toLowerCase()));
      const matchGe = showGe || !s.isGe;
      return matchSearch && matchGe;
    });
    list = [...list].sort((a, b) => {
      if (sortKey === "code")
        return (a.code ?? "").localeCompare(b.code ?? "");
      if (sortKey === "title")
        return (a.title ?? "").localeCompare(b.title ?? "");
      if (sortKey === "units")
        return parseFloat(a.units ?? "0") - parseFloat(b.units ?? "0");
      return 0;
    });
    return list;
  }, [subjects, search, showGe, sortKey]);

  const totalUnits = filteredSubjects.reduce(
    (sum, s) => sum + parseFloat(s.units ?? "0"),
    0
  );

  async function ensureBlock() {
    if (block) return block.id;
    return new Promise<string | null>((resolve) => {
      startTransition(async () => {
        const result = await addOrUpdateCurriculumBlockAction({
          versionId,
          yearLevel,
          termId: term.id,
        });
        if (result?.error) {
          alert(result.error);
          resolve(null);
          return;
        }
        router.refresh();
        resolve("added");
      });
    });
  }

  function handleRemove(blockSubjectId: string) {
    startTransition(async () => {
      const result = await removeSubjectFromBlockAction(blockSubjectId);
      if (result?.error) alert(result.error);
      else router.refresh();
    });
  }

  function handleLabChange(blockSubjectId: string, withLab: boolean) {
    startTransition(async () => {
      await updateBlockSubjectAction(blockSubjectId, { withLab });
      router.refresh();
    });
  }

  const title = `${program?.code ?? "—"} • ${yearLevel} • ${term.name}`;

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-neutral-900">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!block && isDraft && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 py-16 text-center">
            <p className="text-sm text-neutral-600">
              No block for this term yet
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4 bg-[#6A0000] hover:bg-[#6A0000]/90"
              onClick={() => ensureBlock()}
              disabled={pending}
            >
              {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Create Term Block
            </Button>
          </div>
        )}

        {block && (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <Input
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={showGe} onCheckedChange={setShowGe} />
                <span className="text-neutral-700">Show GE</span>
              </label>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="units">Units</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50">
                    <TableHead className="text-xs font-medium text-[#6A0000]">Code</TableHead>
                    <TableHead className="text-xs font-medium text-[#6A0000]">Title</TableHead>
                    <TableHead className="text-xs font-medium text-[#6A0000] text-center">Units</TableHead>
                    <TableHead className="text-xs font-medium text-[#6A0000]">Type</TableHead>
                    <TableHead className="text-xs font-medium text-[#6A0000] text-center">Lab</TableHead>
                    <TableHead className="text-xs font-medium text-[#6A0000]">Pre-req</TableHead>
                    {isDraft && <TableHead className="w-10" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.code}</TableCell>
                      <TableCell className="text-sm">{s.title ?? "—"}</TableCell>
                      <TableCell className="text-center text-sm">
                        {s.units ?? "0"}
                      </TableCell>
                      <TableCell>
                        {s.isGe ? (
                          <Badge variant="secondary">GE</Badge>
                        ) : (
                          <Badge variant="outline">Program</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {isDraft ? (
                          <Switch
                            checked={s.withLab}
                            onCheckedChange={(v) => handleLabChange(s.id, v)}
                            disabled={pending}
                          />
                        ) : (
                          <span className="text-sm">{s.withLab ? "Yes" : "—"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {s.prereqText ?? "—"}
                      </TableCell>
                      {isDraft && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleRemove(s.id)}
                                disabled={pending}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t pt-4 text-sm">
              <span className="font-medium text-neutral-700">
                Total Units: {totalUnits}
              </span>
              <span className="text-neutral-500">Saved</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
