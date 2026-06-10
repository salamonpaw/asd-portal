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
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/partners", req.url));
      }
      if (role === "WAREHOUSE_SPECIALIST") {
        return NextResponse.redirect(new URL("/warehouse", req.url));
      }
      if (role === "SERVICE_TECHNICIAN") {
        return NextResponse.redirect(new URL("/partner/service", req.url));
      }
      return NextResponse.redirect(new URL(
        role === "STAFF" ? "/staff/dashboard" : "/partner/dashboard",
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
  const role = (token?.role as string) || "";

  if (role === "WAREHOUSE_SPECIALIST" && !pathname.startsWith("/warehouse") && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/warehouse", req.url));
  }
  if (role === "SERVICE_TECHNICIAN" && !pathname.startsWith("/partner/service") && !pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/partner/service", req.url));
  }
  if (token && pathname.startsWith("/partner") && role === "STAFF") {
    return NextResponse.redirect(new URL("/staff/dashboard", req.url));
  }
  if (token && pathname.startsWith("/staff") && role === "PARTNER") {
    return NextResponse.redirect(new URL("/partner/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
