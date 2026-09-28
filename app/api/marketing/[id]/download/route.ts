import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, PARTNER_ROLES } from "@/lib/authz";
import { storedName, candidatePaths } from "@/lib/marketing-files";

/** Pobieranie materiału: admin — każdy; partner — tylko aktywny i udostępniony jego firmie. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const material = await db.marketingMaterial.findUnique({ where: { id } });
  if (!material) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role !== "ADMIN") {
    const allowed =
      PARTNER_ROLES.includes(user.role) && !!user.partnerId && material.isActive &&
      !!(await db.marketingMaterialAccess.findUnique({ where: { materialId_partnerId: { materialId: id, partnerId: user.partnerId } } }));
    if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const name = storedName(material.url);
  if (!name) return NextResponse.json({ error: "Not found" }, { status: 404 });

  for (const file of candidatePaths(name)) {
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) continue;
    const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
    const display = material.filename.toLowerCase().endsWith(ext.toLowerCase()) ? material.filename : material.filename + ext;
    return new NextResponse(Readable.toWeb(createReadStream(file)) as ReadableStream, {
      headers: {
        // zawsze jako pobranie — nawet plik HTML/SVG nie wykona się w domenie portalu
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(display)}`,
        "Content-Length": String(info.size),
        "Cache-Control": "private, no-store",
      },
    });
  }
  return NextResponse.json({ error: "Plik nie istnieje na serwerze" }, { status: 404 });
}
