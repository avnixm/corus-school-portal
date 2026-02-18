"use server";

import { NextResponse } from "next/server";
import { createSupportRequest } from "@/db/queries";
import { auth } from "@/lib/auth/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          reason?: string;
          email?: string;
          phone?: string;
          message?: string;
        }
      | null;

    const reason = (body?.reason ?? "account_inactive").trim();
    const email = body?.email ?? null;
    const phone = body?.phone ?? null;
    const message = (body?.message ?? "").trim();

    if (!message || message.length < 10) {
      return NextResponse.json(
        { error: "Please provide a short description (at least 10 characters)." },
        { status: 400 }
      );
    }

    // Best-effort attach user id if a session exists (inactive users may not have one).
    const session = (await auth.getSession())?.data;
    const userId = session?.user?.id ?? null;

    await createSupportRequest({ reason, email, phone, message, userId });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit support request." }, { status: 500 });
  }
}

