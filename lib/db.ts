import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createClient() {
  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  // Hash hasła NIGDY nie jest zwracany z bazy, chyba że zapytanie jawnie poprosi
  // (`omit: { password: false }` — tylko logowanie i zmiana hasła).
  return new PrismaClient({ adapter, omit: { user: { password: true } } });
}

type DB = ReturnType<typeof createClient>;
const globalForPrisma = globalThis as unknown as { prisma?: DB };

export const db: DB = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
