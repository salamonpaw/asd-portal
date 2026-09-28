import { NextResponse } from "next/server";

/**
 * Przekierowanie na ścieżkę w obrębie portalu BEZ składania adresu z nagłówka Host
 * (podmieniony Host mógłby przekierować użytkownika na obcą domenę). Przeglądarka
 * rozwiązuje względny Location względem adresu, który sama otworzyła.
 */
export function redirectLocal(path: string, status: 302 | 303 | 307 = 307) {
  if (!path.startsWith("/") || path.startsWith("//")) path = "/";
  return new NextResponse(null, { status, headers: { Location: path } });
}
