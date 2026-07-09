import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "marketing");
const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const filename = ((formData.get("filename") as string) || "").trim();
    const type = ((formData.get("type") as string) || "OTHER").trim();

    if (!file) return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Plik zbyt duży (max 100 MB)" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const safeExt = ext.replace(/[^a-z0-9]/g, "");
    const stored = `mat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
    const filepath = path.join(UPLOAD_DIR, stored);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const url = `/uploads/marketing/${stored}`;

    const material = await db.marketingMaterial.create({
      data: {
        filename: filename || file.name,
        url,
        mimeType: file.type || null,
        fileSize: file.size,
        type,
        createdBy: session.user.email ?? "admin",
      },
    });

    return NextResponse.json({ success: true, material });
  } catch (err) {
    console.error("[upload/marketing]", err);
    return NextResponse.json({ error: "Błąd serwera przy zapisie pliku" }, { status: 500 });
  }
}
