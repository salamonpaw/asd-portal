import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Root: landing for guests, dashboard for logged-in users
  if (pathname === "/") {
    if (token) {
      const role = (token as any).role as string;
      return NextResponse.redirect(new URL(
        role === "STAFF" || role === "ADMIN" ? "/staff/dashboard" : "/partner/dashboard",
        req.url
      ));
    }
    return NextResponse.next(); // show landing page
  }

  // Protect portal routes
  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth") || pathname.startsWith("/api/content");
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Cross-role protection
  if (token && pathname.startsWith("/partner") && (token as any).role === "STAFF") {
    return NextResponse.redirect(new URL("/staff/dashboard", req.url));
  }
  if (token && pathname.startsWith("/staff") && (token as any).role === "PARTNER") {
    return NextResponse.redirect(new URL("/partner/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
