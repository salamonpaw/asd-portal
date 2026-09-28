import { requirePageRole } from "@/lib/authz";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Icon } from "@/components/ui/Icon";

export const metadata = { title: "Materiały — Partner" };
export const revalidate = 0;

const TYPE_LABELS: Record<string, string> = {
  CATALOG: "Katalog", DATASHEET: "Karta produktu", BROCHURE: "Broszura", VIDEO: "Wideo", OTHER: "Inne",
};

function fmtSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function PartnerMarketingPage() {
  const session = { user: await requirePageRole("PARTNER", "PARTNER_ADMIN") };
  const partnerId = session.user.partnerId;
  if (!partnerId) redirect("/login");

  const materials = await db.marketingMaterial.findMany({
    where: { isActive: true, partnerAccess: { some: { partnerId } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 6 }}>Materiały marketingowe</h1>
      <p style={{ fontSize: 14, color: "var(--ink-3)", marginBottom: 24 }}>
        Katalogi, karty produktów i inne materiały udostępnione przez ASD Systems.
      </p>

      {materials.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "var(--surface-2)", borderRadius: "var(--r)", color: "var(--ink-3)" }}>
          <Icon name="fileText" size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p>Brak udostępnionych materiałów. Skontaktuj się ze swoim handlowcem.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {materials.map((m) => {
            const external = /^https?:\/\//i.test(m.url);
            return (
              <a
                key={m.id}
                href={external ? m.url : `/api/marketing/${m.id}/download`}
                target={external ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="card"
                style={{ padding: 16, display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "inherit" }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--brand-soft)", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  <Icon name={external ? "globe" : "fileText"} size={19} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.filename}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {TYPE_LABELS[m.type] ?? m.type}{m.fileSize ? ` · ${fmtSize(m.fileSize)}` : ""}
                  </div>
                </div>
                <Icon name={external ? "arrowRight" : "arrowRight"} size={18} style={{ color: "var(--ink-4)" }} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
