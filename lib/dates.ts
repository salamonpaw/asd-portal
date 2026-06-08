// Dates from Prisma are Date objects server-side but become strings after
// JSON serialization to client components. Always use toDate() before arithmetic.

export const TODAY = new Date("2026-06-03");

export function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  if (d instanceof Date) return d;
  return new Date(d);
}

export function daysUntil(d: Date | string | null | undefined): number | null {
  const date = toDate(d);
  if (!date) return null;
  return Math.round((date.getTime() - TODAY.getTime()) / 86400000);
}

export function fmtDate(d: Date | string | null | undefined): string {
  const date = toDate(d);
  if (!date) return "—";
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtMonth(s: string | null | undefined): string {
  if (!s) return "—";
  const [y, m] = s.split("-").map(Number);
  const months = ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];
  return `${months[m - 1]} ${y}`;
}
