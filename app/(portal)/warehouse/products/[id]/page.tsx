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
    <div style={{ padding: "32px", maxWidth: "1000px" }}>
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
      </div>

      {/* Main Content: Images + Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
        {/* Images Section */}
        <div>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 12, textTransform: "uppercase" }}>Zdjęcia</h3>
          {images.length > 0 ? (
            <div style={{ display: "grid", gap: 12 }}>
              {images.map((img: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--surface-2)",
                    borderRadius: "var(--r)",
                    padding: 12,
                    textAlign: "center",
                    minHeight: 180,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={img}
                    alt={`${product.name} - ${idx + 1}`}
                    style={{ maxWidth: "100%", maxHeight: 180, borderRadius: "var(--r-sm)" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: "var(--r)",
                padding: 48,
                textAlign: "center",
                color: "var(--ink-3)",
              }}
            >
              <Icon name="image" size={48} />
              <p style={{ marginTop: 12, fontSize: 13 }}>Brak zdjęć produktu</p>
            </div>
          )}
        </div>

        {/* Details Section */}
        <div style={{ display: "grid", gap: 20 }}>
          {/* Pricing */}
          <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 12, textTransform: "uppercase" }}>Ceny</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Zakupu</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {product.costPrice ? parseFloat(product.costPrice.toString()).toFixed(2) : "—"} zł
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Sprzedaży</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--brand)" }}>
                  {product.sellingPrice ? parseFloat(product.sellingPrice.toString()).toFixed(2) : "—"} zł
                </div>
              </div>
            </div>
          </div>

          {/* Warehouse Stock */}
          <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 12, textTransform: "uppercase" }}>Stan magazynu</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>📦 Fizycznie</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: warehouseStock > 0 ? "var(--success)" : "var(--warn)" }}>
                  {warehouseStock} szt.
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Różnica</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: warehouseStock !== (product.inStock || 0) ? "var(--warn)" : "var(--success)" }}>
                  {(warehouseStock || 0) - (product.inStock || 0)} szt.
                </div>
              </div>
            </div>
          </div>

          {/* Serial & Location (Read-Only) */}
          <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 12, textTransform: "uppercase" }}>Szczegóły</h4>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Numer seryjny</div>
                <div style={{ fontSize: 13, fontFamily: "monospace", color: product.serialNumber ? "var(--ink-2)" : "var(--ink-3)" }}>
                  {product.serialNumber || "—"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>Lokalizacja w maszynie</div>
                <div style={{ fontSize: 13, color: product.location ? "var(--ink-2)" : "var(--ink-3)" }}>
                  {product.location || "—"}
                </div>
              </div>
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

      {/* Description (Full Width) */}
      {product.description && (
        <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24, marginBottom: 32 }}>
          <h4 style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 12, textTransform: "uppercase" }}>Opis produktu</h4>
          <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--ink-2)" }}>
            {product.description}
          </div>
        </div>
      )}

      {/* Image Management Form */}
      <ProductImagesForm productId={product.id} currentImages={images} />
    </div>
  );
}
