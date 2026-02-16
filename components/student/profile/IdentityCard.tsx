"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

type IdentityCardProps = {
  fullName: string;
  studentCode: string | null;
  program: string | null;
  programName: string | null;
  yearLevel: string | null;
  status: "applicant" | "enrolled" | "inactive" | "graduated" | "on_leave" | string | null;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
};

function formatStatus(status: string | null): { label: string; className: string } | null {
  if (!status) return null;
  switch (status) {
    case "enrolled":
      return { label: "Enrolled", className: "bg-green-100 text-green-800" };
    case "applicant":
      return { label: "Applicant", className: "bg-amber-100 text-amber-800" };
    case "inactive":
    case "on_leave":
      return { label: status.replace("_", " "), className: "bg-neutral-100 text-neutral-700" };
    case "graduated":
      return { label: "Graduated", className: "bg-[#6A0000]/10 text-[#6A0000]" };
    default:
      return { label: status, className: "bg-neutral-100 text-neutral-700" };
  }
}


export function IdentityCard({
  fullName,
  studentCode,
  program,
  programName,
  yearLevel,
  status,
  email,
  phone,
  photoUrl,
}: IdentityCardProps) {
  const statusInfo = formatStatus(status);
  const [photoError, setPhotoError] = useState(false);
  const showPhoto = photoUrl && !photoError;

  return (
    <Card className="rounded-2xl border border-neutral-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* 2x2 Photo block */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <div className="relative aspect-square w-[160px] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
              {showPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl!}
                  alt={fullName}
                  className="h-full w-full object-cover"
                  onError={() => setPhotoError(true)}
                  referrerPolicy="same-origin"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-neutral-500">
                  <User className="h-12 w-12" strokeWidth={1.5} />
                  <span className="text-xs">No photo</span>
                </div>
              )}
            </div>
            <span className="text-xs text-neutral-500">2x2 ID Photo</span>
          </div>

          {/* Key info */}
          <div className="min-w-0 flex-1 space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
              {fullName}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {studentCode && (
                <Badge variant="outline" className="font-mono text-[#6A0000]">
                  {studentCode}
                </Badge>
              )}
              {(program || programName) && (
                <span className="rounded bg-[#6A0000]/10 px-2 py-0.5 text-xs font-medium text-[#6A0000]">
                  {program ?? programName ?? "—"}
                </span>
              )}
              {yearLevel && (
                <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                  {yearLevel}
                </span>
              )}
              {statusInfo && (
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 text-sm text-neutral-700">
              {email && <span>{email}</span>}
              {phone && <span>{phone}</span>}
              {!email && !phone && <span className="text-neutral-500">—</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
