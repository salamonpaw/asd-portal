/** Zwraca adres tylko gdy to http(s) — blokuje javascript:, data:, itp. */
export function safeHttpUrl(input: unknown): string | null {
  if (typeof input !== "string" || !input.trim()) return null;
  try {
    const u = new URL(input.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
