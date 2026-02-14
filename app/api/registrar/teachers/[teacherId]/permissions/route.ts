import { NextRequest, NextResponse } from "next/server";
import { listTeacherSubjectPermissions } from "@/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const { teacherId } = await params;
  const permissions = await listTeacherSubjectPermissions(teacherId);
  return NextResponse.json(permissions);
}
