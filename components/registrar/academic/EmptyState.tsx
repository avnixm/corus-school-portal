"use client";

import { BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyStatePrograms({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 py-16 px-6 text-center">
      <div className="rounded-full bg-[#6A0000]/10 p-4">
        <GraduationCap className="h-10 w-10 text-[#6A0000]" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-900">No programs yet</h3>
      <p className="mt-1 max-w-[240px] text-sm text-neutral-600">
        Create your first program to start managing subjects and sections.
      </p>
      <Button onClick={onAdd} className="mt-6 gap-2">
        Create your first program
      </Button>
    </div>
  );
}

export function EmptyStateSubjects({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 py-12 px-6 text-center">
      <div className="rounded-full bg-[#6A0000]/10 p-3">
        <BookOpen className="h-8 w-8 text-[#6A0000]" />
      </div>
      <h3 className="mt-3 text-base font-semibold text-neutral-900">No subjects yet</h3>
      <p className="mt-1 text-sm text-neutral-600">Add a program subject or a GE subject to get started.</p>
      <Button onClick={onAdd} variant="outline" size="sm" className="mt-4 gap-2">
        Add Subject
      </Button>
    </div>
  );
}
