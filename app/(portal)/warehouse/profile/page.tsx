import { requirePageRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PageHead } from "@/components/ui";
import { ChangePasswordCard } from "@/components/portal/ChangePasswordCard";
import { UserProfileEditCard } from "@/components/portal/UserProfileEditCard";

export default async function WarehouseProfilePage() {
  const session = { user: await requirePageRole("WAREHOUSE_SPECIALIST", "ADMIN") };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="fadeup" style={{ maxWidth: 820 }}>
      <PageHead title="Mój profil" sub="Twoje dane w systemie." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <UserProfileEditCard initialName={user.name} initialEmail={user.email} />
        <ChangePasswordCard />
      </div>
    </div>
  );
}
