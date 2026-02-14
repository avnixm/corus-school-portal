import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getProfileAndStudentByUserId } from "@/db/queries";
import { getRequirementSubmissionById, insertRequirementFile, updateStudentRequirementSubmission } from "@/db/queries";
import { randomUUID } from "crypto";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];

export async function POST(request: NextRequest) {
  const session = (await auth.getSession())?.data;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getProfileAndStudentByUserId(session.user.id);
  if (!profile?.student) {
    return NextResponse.json({ error: "Student profile required" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const submissionId = formData.get("submissionId") as string | null;
  const file = formData.get("file") as File | null;
  if (!submissionId || !file?.size) {
    return NextResponse.json({ error: "submissionId and file are required" }, { status: 400 });
  }

  const submission = await getRequirementSubmissionById(submissionId);
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
  if (submission.studentId !== profile.student.id) {
    return NextResponse.json({ error: "Not your submission" }, { status: 403 });
  }
  if (submission.status === "verified") {
    return NextResponse.json({ error: "Cannot add files to a verified submission" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }
  const mime = file.type?.toLowerCase() ?? "";
  const allowed = ALLOWED_TYPES.includes(mime) || mime.startsWith("image/");
  if (!allowed) {
    return NextResponse.json({ error: "Allowed types: PDF, JPEG, PNG" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const key = `requirements/${submissionId}/${randomUUID()}.${ext}`;
  // TODO: Store file to S3-compatible storage; for MVP use stub and persist metadata only
  // e.g. const url = await uploadToS3(key, file);
  const url: string | null = null;

  const row = await insertRequirementFile({
    submissionId,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
    storageKey: key,
    url,
  });

  await updateStudentRequirementSubmission(submissionId, {
    status: "submitted",
    submittedAt: new Date(),
  });

  revalidatePath("/student/requirements");
  revalidatePath("/student");
  revalidatePath("/student/enrollment");
  return NextResponse.json({
    id: row.id,
    fileName: row.fileName,
    fileType: row.fileType,
    fileSize: row.fileSize,
    storageKey: row.storageKey,
    url: row.url,
  });
}
