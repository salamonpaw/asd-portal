import path from "path";

/** Pliki marketingowe trzymamy POZA public/ — dostęp tylko przez /api/marketing/[id]/download. */
export const MARKETING_DIR = path.join(process.cwd(), "storage", "marketing");
const LEGACY_DIR = path.join(process.cwd(), "public", "uploads", "marketing");

export const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

/** "file:mat-123.pdf" (nowe) lub "/uploads/marketing/mat-123.pdf" (stare) → nazwa pliku na dysku */
export function storedName(url: string): string | null {
  const m = url.match(/^(?:file:|\/uploads\/marketing\/)([\w.-]+)$/);
  if (!m) return null;
  const name = path.basename(m[1]); // bez ../ itp.
  return name === m[1] ? name : null;
}

/** Kandydaci ścieżki: najpierw storage/, potem stara lokalizacja (przed migracją w deploy.sh). */
export function candidatePaths(name: string) {
  return [path.join(MARKETING_DIR, name), path.join(LEGACY_DIR, name)];
}
