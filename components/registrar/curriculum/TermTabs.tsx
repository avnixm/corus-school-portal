"use client";

import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddSubjectsSheet } from "./AddSubjectsSheet";
import { addOrUpdateCurriculumBlockAction } from "@/app/(portal)/registrar/curriculum/actions";
import { Loader2 } from "lucide-react";

type Block = {
  id: string;
  curriculumVersionId: string;
  yearLevel: string;
  termId: string;
  sortOrder: number;
  termName: string | null;
  subjects: unknown[];
};

type Term = { id: string; name: string };

export function TermTabs({
  versionId,
  blocks,
  terms,
  yearLevel,
  isDraft,
}: {
  versionId: string;
  blocks: Block[];
  terms: Term[];
  yearLevel: string;
  isDraft: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const selectedTermId = searchParams?.get("termId") ?? terms[0]?.id ?? "";
  const selectedTerm = terms.find((t) => t.id === selectedTermId);

  const block = blocks.find(
    (b) => b.yearLevel === yearLevel && b.termId === selectedTermId
  );
  const blockMissing = !block;

  const baseParams = new URLSearchParams(searchParams?.toString() ?? "");
  baseParams.set("versionId", versionId);
  baseParams.set("yearLevel", yearLevel);

  function handleCreateBlock() {
    if (!selectedTermId || !isDraft) return;
    startTransition(async () => {
      const result = await addOrUpdateCurriculumBlockAction({
        versionId,
        yearLevel,
        termId: selectedTermId,
      });
      if (result?.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex overflow-x-auto">
        <div className="flex gap-1 rounded-md border border-neutral-200 bg-neutral-50/50 p-0.5">
          {terms.map((term) => {
            const isActive = selectedTermId === term.id;
            return (
              <Link
                key={term.id}
                href={`/registrar/curriculum?${new URLSearchParams({
                  ...Object.fromEntries(baseParams),
                  termId: term.id,
                }).toString()}`}
                className={`rounded px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {term.name}
              </Link>
            );
          })}
        </div>
      </div>
      {isDraft && (
        <div className="flex flex-wrap gap-2">
          <AddSubjectsSheet
            versionId={versionId}
            blockId={block?.id ?? ""}
            blockExists={!!block}
          />
          {blockMissing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateBlock}
              disabled={pending}
            >
              {pending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              Create Term Block
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
