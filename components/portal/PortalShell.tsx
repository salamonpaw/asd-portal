"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Logo, Avatar } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { NotificationBell } from "./NotificationBell";
import type { Session } from "next-auth";

const NAV_PARTNER = [
  { key: "dashboard",  href: "/partner/dashboard",  label: "Pulpit",           icon: "gauge" },
  { key: "new",        href: "/partner/projects/new",label: "Nowe zgłoszenie", icon: "plus" },
  { key: "projects",   href: "/partner/projects",    label: "Moje projekty",    icon: "layers" },
  { key: "orders",     href: "/partner/orders",      label: "Moje zamówienia",  icon: "shoppingCart" },
  { key: "profile",    href: "/partner/profile",     label: "Mój profil",       icon: "user" },
];

const NAV_STAFF = [
  { key: "dashboard",   href: "/staff/dashboard",   label: "Pulpit",           icon: "gauge" },
  { key: "projects",    href: "/staff/projects",     label: "Projekty",         icon: "layers" },
  { key: "partners",    href: "/staff/partners",     label: "Moi Partnerzy",    icon: "users" },
  { key: "duplicates",  href: "/staff/duplicates",   label: "Duplikaty",        icon: "copy" },
  { key: "profile",     href: "/staff/profile",      label: "Mój profil",       icon: "user" },
];

const NAV_ADMIN = [
  { key: "dashboard",   href: "/staff/dashboard",   label: "Pulpit",           icon: "gauge" },
  { key: "projects",    href: "/staff/projects",     label: "Projekty",         icon: "layers" },
  { key: "partners",    href: "/staff/partners",     label: "Partnerzy",        icon: "users" },
  { key: "duplicates",  href: "/staff/duplicates",   label: "Duplikaty",        icon: "copy" },
  { key: "sep1", href: "", label: "", icon: "" }, // separator
  { key: "machines",    href: "/admin/machine-types", label: "Typy automatów",  icon: "settings" },
  { key: "products",    href: "/admin/products",      label: "Produkty",         icon: "package" },
  { key: "sep2", href: "", label: "", icon: "" }, // separator
  { key: "ausers",     href: "/admin/users",         label: "Użytkownicy",      icon: "user" },
  { key: "amanagepartners", href: "/admin/partners", label: "Zarządzaj Partnerami", icon: "briefcase" },
  { key: "content",    href: "/admin/content",       label: "Treść portalu",    icon: "edit" },
];

export function PortalShell({ session, children }: { session: Session; children: React.ReactNode }) {
  const pathname = usePathname();
  const role = (session.user as any)?.role as string;
  const isAdmin = role === "ADMIN";
  const isStaff = role === "STAFF" || isAdmin;
  const nav = isAdmin ? NAV_ADMIN : isStaff ? NAV_STAFF : NAV_PARTNER;

  const user = session.user!;
  const initials = user.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ padding: "20px 18px 16px" }}>
          <Logo width={172} light />
        </div>
        <nav style={{ padding: "8px 14px", display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "rgba(255,255,255,.4)", fontWeight: 600, padding: "10px 14px 6px" }}>
            {isAdmin ? "Panel Admina" : isStaff ? "Panel Handlowca" : "Panel Partnera"}
          </div>
          {nav.map((n) => {
            if (n.key === "sep") {
              return <div key="sep" style={{ height: 1, background: "rgba(255,255,255,.1)", margin: "8px 0" }} />;
            }
            const active = n.href && (pathname === n.href || pathname.startsWith(n.href + "/") ||
              (n.href === "/partner/projects" && pathname.startsWith("/partner/projects") && !pathname.includes("/order")) ||
              (n.href === "/staff/projects" && pathname.startsWith("/staff/projects")));
            return (
              <Link key={n.key} href={n.href} className={`navitem ${active ? "active" : ""}`}>
                {n.icon && <Icon name={n.icon} size={19} />}{n.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,.1)" }}>
          <button className="navitem" style={{ width: "100%", border: "none", background: "none" }} onClick={() => signOut({ callbackUrl: "/login" })}>
            <Icon name="logout" size={18} />Wyloguj
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="maincol">
        <header className="topbar">
          <div />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationBell />
            <div style={{ width: 1, height: 24, background: "var(--line)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Avatar initials={initials} size={34} color={isStaff ? "var(--accent)" : "var(--brand)"} />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{isStaff ? "ASD Systems" : "Partner"}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
