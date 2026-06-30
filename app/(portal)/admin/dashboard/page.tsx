import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminDashboardStats } from "@/lib/actions/admin-dashboard";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || userRole !== "ADMIN") {
    redirect("/login");
  }

  const result = await getAdminDashboardStats();
  const stats = result.success && "data" in result ? result.data : null;

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8 }}>Admin Dashboard</h1>
        <p style={{ color: "var(--ink-3)" }}>
          Przegląd statystyk zamówień, przychodów i partnerów
        </p>
      </div>

      {stats ? (
        <AdminDashboardClient stats={stats} />
      ) : (
        <div
          style={{
            padding: 24,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            borderRadius: "var(--r-sm)",
          }}
        >
          Nie udało się załadować statystyk
        </div>
      )}
    </div>
  );
}
