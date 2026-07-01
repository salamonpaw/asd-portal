import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ImageGalleryClient } from "./ImageGalleryClient";

export const revalidate = 0;

export default async function ImagesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session || !["WAREHOUSE_SPECIALIST", "ADMIN"].includes(role)) {
    redirect("/login");
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <Link href="/admin/dashboard" style={{ color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="arrow-left" size={16} />
            Wróć
          </Link>
        </div>

        <h1 style={{ marginBottom: 8 }}>📸 Galeria Zdjęć</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Zarządzaj zdjęciami produktów — wgrywaj, przeglądaj i usuwaj
        </p>
      </div>

      {/* Gallery */}
      <ImageGalleryClient />
    </div>
  );
}
