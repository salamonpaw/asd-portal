import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { detectImage } from "@/lib/file-type";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repId = session.user.repId;
  if (!repId) return NextResponse.json({ error: "Not a rep account" }, { status: 403 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Plik zbyt duży (max 5 MB)" }, { status: 400 });
    }

    // Typ rozpoznany z zawartości; rozszerzenie nadajemy sami
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = detectImage(buffer);
    if (!type) {
      return NextResponse.json({ error: "Dozwolone formaty: JPG, PNG, WebP, GIF" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `rep-${repId}-${Date.now()}-${randomBytes(4).toString("hex")}.${type.ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/avatars/${filename}`;

    // Persist URL to rep record
    await db.rep.update({
      where: { id: repId },
      data: { photoUrl: url },
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[upload/avatar]", err);
    return NextResponse.json({ error: "Błąd serwera przy zapisie pliku" }, { status: 500 });
  }
}
