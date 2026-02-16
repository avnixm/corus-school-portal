import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getProfileAndStudentByUserId } from "@/db/queries";
import { db } from "@/lib/db";
import { requirementFiles, studentRequirementSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";

function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

/**
 * GET streams the file for view-only (inline display). Same auth as main route.
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
      storageKey: requirementFiles.storageKey,
      fileType: requirementFiles.fileType,
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

  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, row.storageKey);
  let buffer: Buffer;
  try {
    buffer = await readFile(filePath);
  } catch (err) {
    return NextResponse.json(
      { error: "File not available for viewing (storage not configured or file missing)." },
      { status: 404 }
    );
  }

  const contentType = row.fileType || "application/octet-stream";
  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=300",
    },
  });
}
