"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";

type ReviewSectionProps = {
  title: string;
  data: { label: string; value: string | null | undefined }[];
  onEdit: () => void;
};

function ReviewSection({ title, data, onEdit }: ReviewSectionProps) {
  const filtered = data.filter((d) => d.value);
  if (filtered.length === 0) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-[#6A0000]">
          {title}
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-8 gap-1.5 text-[#6A0000] hover:bg-[#6A0000]/10"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
      <dl className="space-y-1.5 text-sm">
        {filtered.map(({ label, value }) => (
          <div key={label} className="flex gap-2">
            <dt className="w-36 shrink-0 text-neutral-600">{label}</dt>
            <dd className="text-neutral-900">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export type ReviewData = {
  personal: { firstName: string; middleName?: string | null; lastName: string; birthday: string | null };
  contact: { email: string; mobile: string };
  address: { addressLine1: string; barangay: string; city: string; province: string };
  guardian: { guardianName: string; guardianRelationship: string; guardianMobile: string };
  academic: { studentType: string; previousSchool?: string | null; lastGradeCompleted?: string | null };
};

export function ReviewCard({
  data,
  onEditStep,
}: {
  data: ReviewData;
  onEditStep: (step: number) => void;
}) {
  return (
    <div className="space-y-4">
      <ReviewSection
        title="Personal Details"
        data={[
          { label: "Name", value: [data.personal.firstName, data.personal.middleName, data.personal.lastName].filter(Boolean).join(" ") },
          { label: "Date of birth", value: data.personal.birthday ?? undefined },
        ]}
        onEdit={() => onEditStep(1)}
      />
      <ReviewSection
        title="Contact"
        data={[
          { label: "Email", value: data.contact.email },
          { label: "Mobile", value: data.contact.mobile },
        ]}
        onEdit={() => onEditStep(2)}
      />
      <ReviewSection
        title="Address"
        data={[
          { label: "Street / House no.", value: data.address.addressLine1 },
          { label: "Barangay", value: data.address.barangay },
          { label: "City", value: data.address.city },
          { label: "Province", value: data.address.province },
        ]}
        onEdit={() => onEditStep(3)}
      />
      <ReviewSection
        title="Guardian / Emergency"
        data={[
          { label: "Name", value: data.guardian.guardianName },
          { label: "Relationship", value: data.guardian.guardianRelationship },
          { label: "Mobile", value: data.guardian.guardianMobile },
        ]}
        onEdit={() => onEditStep(4)}
      />
      <ReviewSection
        title="Academic Background"
        data={[
          { label: "Student type", value: data.academic.studentType },
          { label: "Previous school", value: data.academic.previousSchool ?? undefined },
          { label: "Last grade completed", value: data.academic.lastGradeCompleted ?? undefined },
        ]}
        onEdit={() => onEditStep(5)}
      />
    </div>
  );
}
