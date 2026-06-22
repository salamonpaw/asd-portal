import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PartnerDiscountsClient } from "./PartnerDiscountsClient";
import { checkPartnerOrderStatus } from "@/lib/actions/partner-discounts";

export default async function PartnerDiscountsPage({
  params,
}: {
  params: Promise<{ partnerId: string }>;
}) {
  const { partnerId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const partner = await db.partner.findUnique({
    where: { id: partnerId },
  });

  if (!partner) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <h1>Partner nie znaleziony</h1>
        <Link href="/admin/partners">← Wróć do listy</Link>
      </div>
    );
  }

  const productsRaw = await db.product.findMany({
    orderBy: { name: "asc" },
    include: {
      partnerDiscounts: {
        where: { partnerId },
      },
    },
  });

  // Convert Decimal to number
  const products = productsRaw.map((p) => ({
    ...p,
    partnerDiscounts: p.partnerDiscounts.map((d) => ({
      ...d,
      discountPercent: parseFloat(d.discountPercent.toString()),
    })),
  }));

  const discounts = await db.partnerProductDiscount.findMany({
    where: { partnerId },
    include: { product: true },
  });

  const orderStatus = await checkPartnerOrderStatus(partnerId);

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      <Link
        href="/admin/partners"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
          color: "var(--brand)",
          textDecoration: "none",
        }}
      >
        <Icon name="arrow-left" size={16} />
        Wróć do partnerów
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>{partner.name} — Zarządzanie rabatami</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Ustaw poziom rabatowy dla każdego produktu
        </p>
      </div>

      {/* Verification Warning */}
      {orderStatus.needsVerification && (
        <div
          style={{
            padding: 16,
            background: "var(--warn-soft)",
            borderRadius: "var(--r)",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "var(--warn)",
          }}
        >
          <Icon name="alert-triangle" size={20} />
          <div>
            <strong>Uwaga!</strong> Partner nie zamawiał przez{" "}
            <strong>{orderStatus.daysAgo} dni</strong> (ponad rok).
            Zweryfikuj rabaty przed dalszą sprzedażą.
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
            Produkty z rabatami
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {discounts.length} / {products.length}
          </div>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 16,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 4 }}>
            Ostatnie zamówienie
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {orderStatus.daysAgo
              ? `${orderStatus.daysAgo} dni temu`
              : "Brak zamówień"}
          </div>
        </div>
      </div>

      <PartnerDiscountsClient partnerId={partnerId} products={products} />
    </div>
  );
}
