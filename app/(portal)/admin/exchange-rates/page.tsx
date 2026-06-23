import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ExchangeRatesClient } from "./ExchangeRatesClient";
import { db } from "@/lib/db";

export default async function ExchangeRatesPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const rates = await db.currencyExchangeRate.findMany({
    orderBy: { effectiveDate: "desc" },
    take: 100,
    include: { partner: { select: { id: true, name: true } } },
  });

  return (
    <div style={{ padding: "32px", maxWidth: "1200px" }}>
      <Link
        href="/staff/dashboard"
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
        Wróć
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>Kursy walut</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Zarządzaj kursami wymiany PLN / EUR / USD dla partnerów
        </p>
      </div>

      <ExchangeRatesClient initialRates={rates} />
    </div>
  );
}
