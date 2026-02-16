import { listCapabilityPackagesByStatus } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { DeanCapabilityTabs } from "./DeanCapabilityTabs";

export const dynamic = "force-dynamic";

export default async function DeanTeacherCapabilitiesPage() {
  const [submitted, approved, rejected] = await Promise.all([
    listCapabilityPackagesByStatus("submitted"),
    listCapabilityPackagesByStatus("approved"),
    listCapabilityPackagesByStatus("rejected"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-[#6A0000]">
          Capability Approvals
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Review and approve teacher capability packages submitted by Program Heads.
        </p>
      </div>

      <DeanCapabilityTabs
        submitted={submitted}
        approved={approved}
        rejected={rejected}
      />
    </div>
  );
}
