import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getUserProfileByUserId } from "@/db/queries";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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

