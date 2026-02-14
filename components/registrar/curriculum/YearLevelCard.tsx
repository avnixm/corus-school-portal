"use client";

import { ChevronDown, ChevronUp, BookOpen, Award } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type YearLevelCardProps = {
  yearLevel: string;
  stats: {
    totalUnits: number;
    totalSubjects: number;
  };
  isExpanded: boolean;
  isDraft: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function YearLevelCard({
  yearLevel,
  stats,
  isExpanded,
  isDraft,
  onToggle,
  children,
}: YearLevelCardProps) {
  return (
    <Card className="rounded-2xl border-2 border-neutral-200 shadow-sm overflow-hidden">
      <CardHeader
        className="cursor-pointer bg-gradient-to-r from-[#6A0000]/5 to-transparent hover:from-[#6A0000]/10 transition-colors p-4"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6A0000]/10">
              <Award className="h-5 w-5 text-[#6A0000]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">{yearLevel}</h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-white">
                  {stats.totalSubjects} subjects
                </Badge>
                <Badge variant="outline" className="text-xs bg-white">
                  {stats.totalUnits} units
                </Badge>
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-neutral-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-neutral-600" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-4 pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
}
