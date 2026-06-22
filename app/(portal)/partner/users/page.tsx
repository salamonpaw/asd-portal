import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPartnerUsers } from "@/lib/actions/partner-users";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { PartnerUsersClient } from "./PartnerUsersClient";

export default async function PartnerUsersPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  const partnerId = (session?.user as any)?.partnerId;

  if (!session || (userRole !== "PARTNER" && userRole !== "PARTNER_ADMIN")) {
    redirect("/login");
  }

  const usersResult = await getPartnerUsers();

  return (
    <div style={{ padding: "32px", maxWidth: "1000px" }}>
      <Link
        href="/partner/dashboard"
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
        <h1 style={{ marginBottom: 8 }}>Zarządzanie serwisantami</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Dodaj nowych serwisantów, którzy będą zamawiać części dla Twojej firmy
        </p>
      </div>

      <PartnerUsersClient initialUsers={usersResult.data || []} />
    </div>
  );
}
