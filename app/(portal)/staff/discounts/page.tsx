import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { DiscountsClient } from "./DiscountsClient";

export const metadata = {
  title: "Rabaty i Rebaty — Handlowca",
};

export default async function DiscountsPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || role !== "STAFF") {
    redirect("/login");
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1400px" }}>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-3)" }}>
        <Link href="/staff/dashboard" style={{ color: "var(--brand)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="home" size={14} />
          Panel Handlowca
        </Link>
        <span>→</span>
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>Rabaty i Rebaty</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Rabaty i Rebaty Partnerów</h1>
        <p style={{ fontSize: 14, color: "var(--ink-3)" }}>
          Zarządzaj rabatami pięcioprocentowymi dla swoich partnerów. Ustaw warunki (liczba maszyn), daty wygaśnięcia i rabaty rezerwowe.
        </p>
      </div>

      {/* Main Content */}
      <DiscountsClient />
    </div>
  );
}
