import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProducts } from "@/lib/actions/products";
import { getMachineTypes } from "@/lib/actions/machine-types";
import { ProductsClient } from "./ProductsClient";

export default async function ProductsPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  if (!session || (userRole !== "ADMIN" && userRole !== "WAREHOUSE_SPECIALIST")) {
    redirect("/login");
  }

  const productsResult = await getProducts();
  const machineTypesResult = await getMachineTypes();

  const products = productsResult.success ? productsResult.data : [];
  const machineTypes = machineTypesResult.success ? machineTypesResult.data : [];

  return (
    <div style={{ padding: "32px" }}>
      <h1>Katalog produktów</h1>
      <p style={{ color: "var(--ink-3)", marginTop: 8 }}>Zarządzanie produktami i częściami zamiennych</p>

      <ProductsClient initialProducts={products as any} machineTypes={machineTypes} userRole={userRole} />
    </div>
  );
}
