/**
 * Rozpoznaje typ obrazu po NAGŁÓWKU pliku (magic bytes), nie po nazwie ani typie
 * zadeklarowanym przez przeglądarkę — oba da się podrobić (np. .html jako image/png).
 * SVG celowo nieobsługiwane: może zawierać skrypty.
 */
export type ImageType = { mime: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; ext: "jpg" | "png" | "webp" | "gif" };

export function detectImage(buf: Buffer): ImageType | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: "image/png", ext: "png" };
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return { mime: "image/webp", ext: "webp" };
  const gif = buf.subarray(0, 6).toString("ascii");
  if (gif === "GIF87a" || gif === "GIF89a") return { mime: "image/gif", ext: "gif" };
  return null;
}
