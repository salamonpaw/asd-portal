import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Proxy tylko przekierowuje zalogowanych z "/" i "/login" na ich pulpit.
// Kontrola dostępu jest w stronach / API / akcjach (proxy jej NIE zastępuje).
const HOME: Record<string, string> = {
  SERVICE_TECHNICIAN: "/service-technician/dashboard",
  WAREHOUSE_SPECIALIST: "/warehouse",
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
};

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.next();
  // Proxy wymaga adresu absolutnego. Origin z żądania dotyczy tylko osoby, która je wysłała
  // (podrobiony Host przekieruje wyłącznie ją samą), więc nie da się tym zaatakować innych.
  const url = request.nextUrl.clone();
  url.pathname = HOME[token.role as string] ?? "/partner/dashboard";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/", "/login"],
};
