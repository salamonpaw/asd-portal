import { db } from "@/lib/db";
import { Logo } from "@/components/ui";
import { RequestFormClient } from "./RequestFormClient";

export const metadata = { title: "Zgłoszenie projektu — ASD Partner Portal", robots: { index: false } };

export default async function RepRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const rep = await db.partnerSalesRep.findUnique({
    where: { formToken: token },
    include: { partner: { select: { name: true } } },
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-2, #F4F2EC)" }}>
      <header style={{ background: "var(--brand-900, #121E40)", padding: "16px 20px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}><Logo width={150} light /></div>
      </header>
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "28px 16px 64px" }}>
        {!rep || !rep.active ? (
          <div className="card" style={{ padding: 32, textAlign: "center" }}>
            <h1 style={{ fontSize: 22 }}>Link jest nieaktywny</h1>
            <p style={{ color: "var(--ink-3)", marginTop: 8 }}>Poproś swojego opiekuna o nowy link do formularza zgłoszeń.</p>
          </div>
        ) : (
          <RequestFormClient token={token} repName={rep.name} partnerName={rep.partner.name} />
        )}
      </main>
    </div>
  );
}
