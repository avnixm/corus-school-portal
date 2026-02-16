import { notFound } from "next/navigation";
import Link from "next/link";
import { getCapabilityPackageById, listCapabilityLines } from "@/db/queries";
import { DeanCapabilityReview } from "./DeanCapabilityReview";

export const dynamic = "force-dynamic";

export const metadata = { title: "Capability Review" };

export default async function DeanCapabilityReviewPage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const { packageId } = await params;
  const [pkg, lines] = await Promise.all([
    getCapabilityPackageById(packageId),
    listCapabilityLines(packageId),
  ]);
  if (!pkg) notFound();
  if (pkg.status !== "submitted") {
    return (
      <div className="space-y-4">
        <Link href="/dean/teacher-capabilities" className="text-sm text-[#6A0000] hover:underline">
          ← Back to Capability Approvals
        </Link>
        <p className="text-neutral-600">
          This package is already {pkg.status}. Only submitted packages can be reviewed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dean/teacher-capabilities" className="text-sm text-[#6A0000] hover:underline">
        ← Back to Capability Approvals
      </Link>
      <DeanCapabilityReview pkg={pkg} lines={lines} />
    </div>
  );
}
