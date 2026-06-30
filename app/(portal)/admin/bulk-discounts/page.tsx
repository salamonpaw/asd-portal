import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getAllPartners, getAllProducts } from "@/lib/actions/bulk-discounts";
import { BulkDiscountsClient } from "./BulkDiscountsClient";

export default async function BulkDiscountsPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "ADMIN") {
    redirect("/login");
  }

  const partnersResult = await getAllPartners();
  const productsResult = await getAllProducts();

  const partners = partnersResult.success && "data" in partnersResult ? partnersResult.data : [];
  const products = productsResult.success && "data" in productsResult ? productsResult.data : [];

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      {/* Navigation */}
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/admin/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "var(--brand)",
            textDecoration: "none",
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          <Icon name="arrow-left" size={16} />
          Powrót do dashboardu
        </Link>

        <h1 style={{ marginBottom: 8 }}>Rabaty Hurtowe</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Przypisz rabaty do wielu partnerów i produktów na raz
        </p>
      </div>

      <BulkDiscountsClient partners={partners} products={products} />
    </div>
  );
}
