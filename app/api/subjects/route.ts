import { NextResponse } from "next/server";
import { getSubjectsList } from "@/db/queries";

export async function GET() {
  const subjects = await getSubjectsList();
  return NextResponse.json(subjects);
}
