import { Role } from "@prisma/client";

const PARTNER_BOUND: Role[] = ["PARTNER", "PARTNER_ADMIN", "SERVICE_TECHNICIAN"];

/** Walidacja danych konta z panelu admina. Zwraca dane albo komunikat błędu. */
export function parseUserInput(body: Record<string, unknown>, opts: { requirePassword: boolean }) {
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 200) : "";
  const password = typeof body.password === "string" ? body.password.trim() : "";
  const role = body.role as Role;

  if (!name || !email) return { error: "Imię i e-mail są wymagane." } as const;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Nieprawidłowy e-mail." } as const;
  if (!Object.values(Role).includes(role)) return { error: "Nieprawidłowa rola." } as const;
  if (opts.requirePassword && !password) return { error: "Hasło jest wymagane." } as const;
  if (password && password.length < 8) return { error: "Hasło musi mieć min. 8 znaków." } as const;

  const partnerId = PARTNER_BOUND.includes(role) && typeof body.partnerId === "string" && body.partnerId ? body.partnerId : null;
  const repId = role === "STAFF" && typeof body.repId === "string" && body.repId ? body.repId : null;
  if (PARTNER_BOUND.includes(role) && !partnerId) return { error: "Wybierz partnera dla tego konta." } as const;

  return { data: { name, email, password, role, partnerId, repId } } as const;
}
