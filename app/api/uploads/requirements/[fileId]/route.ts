import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getProfileAndStudentByUserId } from "@/db/queries";
import { db } from "@/lib/db";
import { requirementFiles, studentRequirementSubmissions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET returns a signed URL for the file (or placeholder).
 * TODO: When S3 is configured, generate presigned URL from storage_key.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getProfileAndStudentByUserId(session.user.id);
  const { fileId } = await params;
  const rows = await db
    .select({
      id: requirementFiles.id,
      submissionId: requirementFiles.submissionId,
      storageKey: requirementFiles.storageKey,
      url: requirementFiles.url,
      studentId: studentRequirementSubmissions.studentId,
    })
    .from(requirementFiles)
    .innerJoin(
      studentRequirementSubmissions,
      eq(requirementFiles.submissionId, studentRequirementSubmissions.id)
    )
    .where(eq(requirementFiles.id, fileId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isOwner = profile?.student && row.studentId === profile.student.id;
  const canViewOthers =
    profile?.profile?.role === "registrar" || profile?.profile?.role === "admin";
  if (!isOwner && !canViewOthers) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (row.url) {
    return NextResponse.json({ url: row.url });
  }
  // View-only URL: stream file from local uploads (no download)
  return NextResponse.json({
    url: `/api/uploads/requirements/${fileId}/view`,
  });
}
