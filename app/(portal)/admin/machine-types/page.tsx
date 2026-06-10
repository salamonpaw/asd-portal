import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMachineTypes } from "@/lib/actions/machine-types";
import { MachineTypesClient } from "./MachineTypesClient";

export default async function MachineTypesPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const result = await getMachineTypes();
  const machineTypes = result.success ? result.data : [];

  return (
    <div style={{ padding: "32px" }}>
      <h1>Typy automatów</h1>
      <p style={{ color: "var(--ink-3)", marginTop: 8 }}>Zarządzanie typami automatów (Bębnowy, Szafkowy, Terminal, etc.)</p>

      <MachineTypesClient initialMachineTypes={machineTypes} />
    </div>
  );
}
