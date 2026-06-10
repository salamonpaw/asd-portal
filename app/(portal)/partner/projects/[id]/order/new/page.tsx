import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SectionCard } from "@/components/ui";
import Link from "next/link";
import { CreateOrderClient } from "@/components/portal/CreateOrderClient";

export default async function CreateOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["PARTNER"].includes(session.user?.role))
    return redirect("/");

  const partnerId = session.user.partnerId;
  if (!partnerId) return redirect("/");

  const { id } = await params;

  const project = await db.project.findUnique({
    where: { id },
    include: { partner: true, rep: true },
  });

  if (!project) return redirect("/partner/projects");
  if (project.partnerId !== partnerId) return redirect("/partner/projects");
  if (project.status !== "ACTIVE" && project.status !== "NOPROT")
    return redirect(`/partner/projects/${id}`);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Link href={`/partner/projects/${id}`} style={{ color: "#22356B", textDecoration: "none", marginBottom: 24, display: "inline-block" }}>
        ← Wróć do projektu
      </Link>

      <h1 style={{ marginBottom: 24 }}>Złóż zamówienie</h1>

      <SectionCard>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 14, color: "#767B86", margin: 0 }}>
            Projekt: <strong>{project.customerName}</strong>
          </p>
        </div>

        <CreateOrderClient projectId={id} projectName={project.customerName} />
      </SectionCard>
    </div>
  );
}
