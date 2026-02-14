"use client";

import { cn } from "@/lib/utils";
import { Check, User, Mail, MapPin, Users, GraduationCap, FileCheck } from "lucide-react";

const STEPS = [
  { num: 1, label: "Personal", icon: User },
  { num: 2, label: "Contact", icon: Mail },
  { num: 3, label: "Address", icon: MapPin },
  { num: 4, label: "Guardian", icon: Users },
  { num: 5, label: "Academic", icon: GraduationCap },
  { num: 6, label: "Review", icon: FileCheck },
] as const;

export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
  compact = false,
}: {
  currentStep: number;
  completedSteps: Set<number>;
  onStepClick?: (step: number) => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 md:hidden">
        <select
          value={currentStep}
          onChange={(e) => onStepClick?.(Number(e.target.value))}
          className="w-full rounded-md border border-[#6A0000]/30 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#6A0000]/40"
        >
          {STEPS.map((s) => (
            <option key={s.num} value={s.num}>
              Step {s.num}: {s.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <nav className="hidden md:block space-y-1">
      {STEPS.map(({ num, label, icon: Icon }) => {
        const isActive = currentStep === num;
        const isCompleted = completedSteps.has(num);
        const isClickable = onStepClick && (isCompleted || num < currentStep);

        return (
          <button
            key={num}
            type="button"
            onClick={() => isClickable && onStepClick(num)}
            disabled={!isClickable}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              isActive && "bg-[#6A0000] text-white",
              !isActive && isCompleted && "bg-[#6A0000]/10 text-[#6A0000]",
              !isActive && !isCompleted && "text-neutral-600 hover:bg-neutral-100",
              isClickable && "cursor-pointer",
              !isClickable && !isActive && "cursor-default"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                isActive && "bg-white/20",
                isCompleted && !isActive && "bg-[#6A0000]/20",
                !isActive && !isCompleted && "bg-neutral-200"
              )}
            >
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </span>
            <span className="font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
