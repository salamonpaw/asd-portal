import { timingSafeEqual, createHash } from "crypto";
import type { NextRequest } from "next/server";

/** Sprawdza "Authorization: Bearer <CRON_SECRET_TOKEN>" w stałym czasie (bez wycieku przez timing). */
export function isCronAuthorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET_TOKEN;
  if (!expected || expected.length < 16) return false; // brak lub za krótki token = cron wyłączony
  const got = request.headers.get("authorization") ?? "";
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(`Bearer ${expected}`).digest();
  return timingSafeEqual(a, b);
}
