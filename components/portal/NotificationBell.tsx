"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

interface Notification {
  id: string;
  type: "order" | "project" | "message";
  title: string;
  description: string;
  link: string;
  read: boolean;
  createdAt: Date;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && notifications.length === 0) {
      loadNotifications();
    }
  }, [open]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  const notificationTypeIcon: Record<string, string> = {
    order: "shoppingCart",
    project: "layers",
    message: "mail",
  };

  const notificationTypeColor: Record<string, string> = {
    order: "#D97706",
    project: "#0EA5E9",
    message: "#8B5CF6",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          color: "var(--ink-2)",
          transition: "background 200ms",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--surface-2)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 18,
              height: 18,
              background: "#EF4444",
              color: "#fff",
              borderRadius: "50%",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            width: 360,
            maxHeight: 500,
            marginTop: 8,
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 12,
            boxShadow: "var(--sh-2)",
            zIndex: 100,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface-1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Powiadomienia</div>
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    notifications.forEach((n) => {
                      if (!n.read) markAsRead(n.id);
                    });
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--brand)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Oznacz wszystkie
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>
                Ładowanie...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center" }}>
                <Icon name="inbox" size={32} style={{ color: "var(--ink-4)", marginBottom: 8 }} />
                <div style={{ color: "var(--ink-3)", fontSize: 13 }}>Brak powiadomień</div>
              </div>
            ) : (
              notifications.map((notif) => (
                <Link
                  key={notif.id}
                  href={notif.link}
                  onClick={() => {
                    if (!notif.read) markAsRead(notif.id);
                    setOpen(false);
                  }}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--line)",
                    textDecoration: "none",
                    background: notif.read ? "transparent" : "var(--surface-1)",
                    transition: "background 150ms",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--surface-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = notif.read
                      ? "transparent"
                      : "var(--surface-1)")
                  }
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: notificationTypeColor[notif.type] + "20",
                      color: notificationTypeColor[notif.type],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                    }}
                  >
                    <Icon
                      name={notificationTypeIcon[notif.type]}
                      size={16}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: notif.read ? 400 : 600,
                        color: "var(--ink)",
                        marginBottom: 2,
                      }}
                    >
                      {notif.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ink-3)",
                        marginBottom: 4,
                      }}
                    >
                      {notif.description}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-4)" }}>
                      {formatTime(new Date(notif.createdAt))}
                    </div>
                  </div>
                  {!notif.read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "var(--brand)",
                        flex: "none",
                        marginTop: 4,
                      }}
                    />
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "Przed chwilą";
  if (diff < 3600) return `${Math.floor(diff / 60)}m temu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h temu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d temu`;
  return date.toLocaleDateString("pl-PL");
}
