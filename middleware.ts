import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect /student and /registrar routes
  if (pathname.startsWith("/student") || pathname.startsWith("/registrar")) {
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
  matcher: ["/student/:path*", "/registrar/:path*"],
};

