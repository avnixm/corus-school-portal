import { NextRequest, NextResponse } from "next/server";
import { getScheduleApprovalDetails } from "@/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ approvalId: string }> }
) {
  const { approvalId } = await params;
  const details = await getScheduleApprovalDetails(approvalId);
  
  if (!details) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  
  return NextResponse.json(details);
}
