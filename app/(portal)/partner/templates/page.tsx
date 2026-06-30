import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getPartnerTemplates } from "@/lib/actions/order-templates";
import { OrderTemplatesClient } from "./OrderTemplatesClient";

export default async function OrderTemplatesPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const partnerId = (session?.user as any)?.partnerId;

  if (!session || (userRole !== "PARTNER_ADMIN" && userRole !== "SERVICE_TECHNICIAN")) {
    redirect("/login");
  }

  if (!partnerId) {
    redirect("/login");
  }

  const result = await getPartnerTemplates(partnerId);
  const templates = result.success && "data" in result ? result.data : [];

  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }}>
      {/* Navigation */}
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/partner/service"
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
          Powrót do zamówień
        </Link>

        <h1 style={{ marginBottom: 8 }}>Szablony Zamówień</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Tworzy i zarządzaj szablonami zamówień dla szybkiego tworzenia zamówień
        </p>
      </div>

      <OrderTemplatesClient initialTemplates={templates} partnerId={partnerId} />
    </div>
  );
}
