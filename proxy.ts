import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Root redirect
  if (pathname === "/") {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    const role = (token as any).role as string;
    if (role === "STAFF" || role === "ADMIN") {
      return NextResponse.redirect(new URL("/staff/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/partner/dashboard", req.url));
  }

  // Protect portal routes
  if (!token && !pathname.startsWith("/api/auth") && pathname !== "/login") {
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
