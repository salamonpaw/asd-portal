import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const pathname = request.nextUrl.pathname;

  // If logged in and on login page, redirect by role
  if (token && pathname === "/login") {
    const role = token.role as string;
    if (role === "SERVICE_TECHNICIAN") {
      return NextResponse.redirect(new URL("/service-technician/dashboard", request.url));
    } else if (role === "WAREHOUSE_SPECIALIST") {
      return NextResponse.redirect(new URL("/warehouse", request.url));
    } else if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else if (role === "STAFF") {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/partner/dashboard", request.url));
    }
  }

  // If on root "/" and logged in, redirect by role
  if (token && pathname === "/") {
    const role = token.role as string;
    if (role === "SERVICE_TECHNICIAN") {
      return NextResponse.redirect(new URL("/service-technician/dashboard", request.url));
    } else if (role === "WAREHOUSE_SPECIALIST") {
      return NextResponse.redirect(new URL("/warehouse", request.url));
    } else if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else if (role === "STAFF") {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/partner/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login"],
};
