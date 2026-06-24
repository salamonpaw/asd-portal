import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getAllInventory } from "@/lib/actions/inventory";
import { InventoryClient } from "./InventoryClient";

export default async function InventoryPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "WAREHOUSE_SPECIALIST") {
    redirect("/login");
  }

  const result = await getAllInventory();

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      <Link
        href="/warehouse/dashboard"
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
        Wróć do dashboard
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>Stan magazynowy</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Bulk aktualizacja stanu magazynu z WZ, historia zmian
        </p>
      </div>

      <InventoryClient initialInventory={result.data || []} />
    </div>
  );
}
