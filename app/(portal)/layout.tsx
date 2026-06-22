import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { readFileSync } from "fs";
import { join } from "path";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  let version = "0.2.0";
  try {
    version = readFileSync(join(process.cwd(), "VERSION"), "utf-8").trim();
  } catch (error) {
    // fallback version
  }

  return (
    <PortalShell session={session} version={version}>
      {children}
    </PortalShell>
  );
}
