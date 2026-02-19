import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/lib/auth/getUserProfileForMiddleware";

const PROGRAM_HEAD_REDIRECTS: [string, string][] = [
  ["/program-head/classes", "/program-head/sections"],
  ["/program-head/clearance", "/program-head/finance"],
  ["/program-head/schedules", "/program-head/scheduling"],
  ["/program-head/submissions", "/program-head/grades"],
];

const PROGRAM_HEAD_VIEW: Record<string, string> = {
  "/program-head/clearance": "clearance",
  "/program-head/schedules": "schedules",
  "/program-head/submissions": "submissions",
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.searchParams.toString();
  const q = search ? `?${search}` : "";

  // Legacy program-head paths: redirect with query preservation and view param
  for (const [from, to] of PROGRAM_HEAD_REDIRECTS) {
    if (pathname === from) {
      const view = PROGRAM_HEAD_VIEW[from];
      const dest = new URL(to, request.url);
      if (view) dest.searchParams.set("view", view);
      if (search) {
        for (const [k, v] of request.nextUrl.searchParams) {
          dest.searchParams.set(k, v);
        }
      }
      return NextResponse.redirect(dest);
    }
  }

  // Protect portal routes (auth only; role checks in layout)
  if (
    pathname.startsWith("/student") ||
    pathname.startsWith("/registrar") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/finance") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/program-head") ||
    pathname.startsWith("/dean")
  ) {
    let session = null;
    try {
      const sessionResponse = await auth.getSession();
      session = sessionResponse?.data;
    } catch {
      // fetch failed (network/auth service unreachable) — treat as unauthenticated
    }

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if user is active
    try {
      const profile = await getUserProfileByUserId(session.user.id);
      if (profile && profile.active === false) {
        // User is inactive - sign them out and redirect to not-authorized page
        await auth.signOut();
        const notAuthorizedUrl = new URL("/not-authorized", request.url);
        notAuthorizedUrl.searchParams.set("reason", "account_inactive");
        return NextResponse.redirect(notAuthorizedUrl);
      }
    } catch {
      // If profile check fails, allow through (might be transient error)
      // The layout/page will handle it
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/student/:path*",
    "/registrar/:path*",
    "/admin/:path*",
    "/finance/:path*",
    "/teacher/:path*",
    "/program-head/:path*",
    "/dean/:path*",
  ],
};

