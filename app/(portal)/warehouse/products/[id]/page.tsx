import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ProductImagesForm } from "./ProductImagesForm";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "WAREHOUSE_SPECIALIST") {
    redirect("/login");
  }

  const product = await db.product.findUnique({
    where: { id },
    include: { machineType: true },
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

  return (
    <div style={{ padding: "32px", maxWidth: "900px" }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/warehouse/products" style={{ color: "var(--brand)", textDecoration: "none", fontSize: 14 }}>
          ← Wróć do listy produktów
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
        {/* Images */}
        <div>
          {images.length > 0 ? (
            <div style={{ display: "grid", gap: 12 }}>
              {images.map((img: string, idx: number) => (
                <div
                  key={idx}
                  style={{
                    background: "var(--surface-2)",
                    borderRadius: "var(--r)",
                    padding: 16,
                    textAlign: "center",
                    minHeight: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={img}
                    alt={`${product.name} - ${idx + 1}`}
                    style={{ maxWidth: "100%", maxHeight: 200, borderRadius: "var(--r-sm)" }}
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
              <p style={{ marginTop: 12 }}>Brak zdjęć produktu</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>SKU</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{product.sku}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Nazwa</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{product.name}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Typ automatu</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{product.machineType?.label}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Numer seryjny</div>
            <div style={{ fontSize: 14, fontFamily: "monospace" }}>{product.serialNumber || "—"}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Lokalizacja w maszynie</div>
            <div style={{ fontSize: 14 }}>{product.location || "—"}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Ceny</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Zakupu</div>
                <div style={{ fontWeight: 600 }}>{product.costPrice ? parseFloat(product.costPrice.toString()).toFixed(2) : "—"} zł</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Sprzedaży</div>
                <div style={{ fontWeight: 600, color: "var(--brand)" }}>{product.sellingPrice ? parseFloat(product.sellingPrice.toString()).toFixed(2) : "—"} zł</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div style={{ background: "var(--paper)", border: "1px solid var(--ink-2)", borderRadius: "var(--r)", padding: 24 }}>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 12, fontWeight: 600 }}>Opis produktu</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--ink-2)" }}>
            {product.description}
          </div>
        </div>
      )}

      {/* Stock */}
      {product.inStock !== null && (
        <div style={{ marginTop: 24, background: "var(--surface-2)", borderRadius: "var(--r)", padding: 16 }}>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>Stan magazynowy</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{product.inStock} szt.</div>
        </div>
      )}

      {/* Images Management */}
      <div style={{ marginTop: 32 }}>
        <ProductImagesForm productId={product.id} currentImages={images} />
      </div>
    </div>
  );
}
