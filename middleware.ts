import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

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
    const sessionResponse = await auth.getSession();
    const session = sessionResponse?.data;

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url));
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

