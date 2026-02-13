import { notFound } from "next/navigation";
import Link from "next/link";
import { getPendingApplicationById } from "@/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingApplicationActions } from "@/components/portal/PendingApplicationActions";
import { getCurrentUserWithStudent } from "@/lib/auth/getCurrentStudent";

export const dynamic = "force-dynamic";

export default async function PendingApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCurrentUserWithStudent();
  const profileId = data?.profile.id ?? null;

  const row = await getPendingApplicationById(id);

  if (!row || row.status !== "pending") {
    notFound();
  }

  const fullName = [row.firstName, row.middleName, row.lastName]
    .filter(Boolean)
    .join(" ");
  const address = [row.street, row.barangay && `Brgy ${row.barangay}`, row.municipality, row.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/registrar/pending"
            className="text-sm font-medium text-[#6A0000] hover:underline"
          >
            ← Back to pending
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#6A0000]">
            Application: {fullName}
          </h2>
        </div>
        {profileId && (
          <PendingApplicationActions
            applicationId={id}
            registrarProfileId={profileId}
          />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-neutral-600">Name:</span>{" "}
              <span className="font-medium text-[#6A0000]">{fullName}</span>
            </p>
            <p>
              <span className="text-neutral-600">Email:</span>{" "}
              {row.email ?? "—"}
            </p>
            <p>
              <span className="text-neutral-600">Birthday:</span>{" "}
              {row.birthday
                ? new Date(row.birthday).toLocaleDateString()
                : "—"}
            </p>
            <p>
              <span className="text-neutral-600">Program:</span>{" "}
              {row.program ?? "—"}
            </p>
            <p>
              <span className="text-neutral-600">Year Level:</span>{" "}
              {row.yearLevel ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{address || "—"}</p>
          </CardContent>
        </Card>
      </div>

      {row.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-[#6A0000]">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm text-neutral-700">
            {row.notes}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-neutral-500">
        Submitted:{" "}
        {row.createdAt
          ? new Date(row.createdAt).toLocaleString()
          : "—"}
      </p>
    </div>
  );
}
