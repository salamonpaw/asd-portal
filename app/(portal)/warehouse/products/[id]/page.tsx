import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ProductImagesForm } from "./ProductImagesForm";
import { ProductDetailsForm } from "./ProductDetailsForm";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "WAREHOUSE_SPECIALIST") {
    redirect("/login");
  }

  const product = await db.product.findUnique({
    where: { id },
    include: {
      machineType: true,
      inventory: {
        select: { currentStock: true },
      },
    },
  });

  if (!product) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <h1>Produkt nie znaleziony</h1>
        <Link href="/warehouse/products">← Wróć do listy produktów</Link>
      </div>
    );
  }

  const images = product.images ? JSON.parse(product.images) : [];
  const warehouseStock = product.inventory?.currentStock || 0;

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      {/* Navigation */}
      <Link href="/warehouse/products" style={{ color: "var(--brand)", textDecoration: "none", fontSize: 14, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="arrow-left" size={16} />
        Wróć do listy produktów
      </Link>

      {/* Header Section: Key Info */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24, marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", gap: 24, alignItems: "start" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>SKU</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>{product.sku}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Nazwa</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{product.name}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Typ automatu</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{product.machineType?.label || "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Dostępne</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: product.inStock && product.inStock > 0 ? "var(--success)" : "var(--warn)" }}>
              {product.inStock || 0} szt.
            </div>
          </div>
        </div>

        {/* Pricing & Warehouse Stock Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 24, marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--ink-2)" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Cena zakupu</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {product.costPrice ? parseFloat(product.costPrice.toString()).toFixed(2) : "—"} zł
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Cena sprzedaży</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--brand)" }}>
              {product.sellingPrice ? parseFloat(product.sellingPrice.toString()).toFixed(2) : "—"} zł
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>📦 Fizycznie</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: warehouseStock > 0 ? "var(--success)" : "var(--warn)" }}>
              {warehouseStock} szt.
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Różnica</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: warehouseStock !== (product.inStock || 0) ? "var(--warn)" : "var(--success)" }}>
              {(warehouseStock || 0) - (product.inStock || 0)} szt.
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Description + Image Gallery */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24, marginBottom: 32 }}>
        {/* Description */}
        <div style={{ marginBottom: product.description ? 32 : 0 }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 12, textTransform: "uppercase" }}>Opis produktu</h3>
          <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", color: product.description ? "var(--ink-2)" : "var(--ink-3)" }}>
            {product.description || "Brak opisu produktu"}
          </div>
        </div>

        {/* Image Gallery */}
        {images.length > 0 ? (
          <div>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 16, textTransform: "uppercase" }}>Zdjęcia</h3>

            {/* Main Image */}
            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: "var(--r)",
                padding: 24,
                textAlign: "center",
                minHeight: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <img
                id="main-image"
                src={images[0]}
                alt={product.name}
                style={{ maxWidth: "100%", maxHeight: 300, borderRadius: "var(--r-sm)" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const mainImg = document.getElementById("main-image") as HTMLImageElement;
                      if (mainImg) mainImg.src = img;
                    }}
                    style={{
                      background: "var(--surface-2)",
                      border: "2px solid transparent",
                      borderRadius: "var(--r-sm)",
                      padding: 4,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 80,
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--brand)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ maxWidth: "100%", maxHeight: 70 }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "var(--ink-3)",
              padding: 48,
            }}
          >
            <Icon name="image" size={48} />
            <p style={{ marginTop: 12, fontSize: 13 }}>Brak zdjęć produktu</p>
          </div>
        )}
      </div>

      {/* Details (Serial, Location) - Read Only Display */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24, marginBottom: 32 }}>
        <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 16, textTransform: "uppercase" }}>Szczegóły produktu</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>Numer seryjny</div>
            <div style={{ fontSize: 14, fontFamily: "monospace", color: product.serialNumber ? "var(--ink-2)" : "var(--ink-3)" }}>
              {product.serialNumber || "—"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 8 }}>Lokalizacja w maszynie</div>
            <div style={{ fontSize: 14, color: product.location ? "var(--ink-2)" : "var(--ink-3)" }}>
              {product.location || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Section */}
      <div style={{ marginBottom: 32 }}>
        <ProductDetailsForm
          product={{
            id: product.id,
            name: product.name,
            description: product.description || "",
            serialNumber: product.serialNumber || "",
            location: product.location || "",
          }}
        />
      </div>

      {/* Image Management Form */}
      <ProductImagesForm productId={product.id} currentImages={images} />
    </div>
  );
}
