"use client";

import { DashboardStats } from "@/lib/actions/admin-dashboard";

interface AdminDashboardClientProps {
  stats: DashboardStats;
}

export function AdminDashboardClient({ stats }: AdminDashboardClientProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div>
      {/* Key Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Total Orders */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 24,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
            Całkowite Zamówienia
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            {stats.totalOrders}
          </div>
          <div style={{ fontSize: 12, color: "var(--brand)" }}>
            Wszystkie Service Orders
          </div>
        </div>

        {/* Total Revenue */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 24,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
            Całkowity Przychód
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            {formatCurrency(stats.totalRevenue)}
          </div>
          <div style={{ fontSize: 12, color: "var(--brand)" }}>
            Ze wszystkich zamówień
          </div>
        </div>

        {/* Total Partners */}
        <div
          style={{
            background: "var(--paper)",
            border: "1px solid var(--ink-2)",
            borderRadius: "var(--r)",
            padding: 24,
          }}
        >
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 8 }}>
            Partnerzy
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
            {stats.totalPartners}
          </div>
          <div style={{ fontSize: 12, color: "var(--brand)" }}>
            Zarejestrowanych partnerów
          </div>
        </div>
      </div>

      {/* Orders by Status */}
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--ink-2)",
          borderRadius: "var(--r)",
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Zamówienia wg Statusu
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {Object.entries(stats.ordersByStatus).map(([status, count]) => (
            <div
              key={status}
              style={{
                padding: 12,
                background: "var(--surface-2)",
                borderRadius: "var(--r-sm)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{status}</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Partners */}
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--ink-2)",
          borderRadius: "var(--r)",
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Top 5 Partnerów (wg Przychodu)
        </h2>
        <div>
          {stats.topPartners.length > 0 ? (
            stats.topPartners.map((partner, idx) => (
              <div
                key={partner.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom:
                    idx < stats.topPartners.length - 1
                      ? "1px solid var(--ink-2)"
                      : "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {idx + 1}. {partner.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                    {partner.orderCount} zamówień
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {formatCurrency(partner.revenue)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "var(--ink-3)" }}>Brak danych</div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div
        style={{
          background: "var(--paper)",
          border: "1px solid var(--ink-2)",
          borderRadius: "var(--r)",
          padding: 24,
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Ostatnie Zamówienia (10)
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid var(--ink-2)" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px",
                    fontWeight: 600,
                    color: "var(--ink-3)",
                  }}
                >
                  Kod
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px",
                    fontWeight: 600,
                    color: "var(--ink-3)",
                  }}
                >
                  Partner
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px",
                    fontWeight: 600,
                    color: "var(--ink-3)",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "8px",
                    fontWeight: 600,
                    color: "var(--ink-3)",
                  }}
                >
                  Wartość
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "8px",
                    fontWeight: 600,
                    color: "var(--ink-3)",
                  }}
                >
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: "1px solid var(--ink-2)" }}
                >
                  <td style={{ padding: "8px", fontWeight: 600 }}>
                    {order.code}
                  </td>
                  <td style={{ padding: "8px" }}>{order.partnerName}</td>
                  <td style={{ padding: "8px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        background: getStatusColor(order.status),
                        borderRadius: "var(--r-sm)",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "8px",
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(order.totalPrice)}
                  </td>
                  <td style={{ padding: "8px" }}>
                    {new Date(order.createdAt).toLocaleDateString("pl")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "NOWE":
      return "var(--primary-soft)";
    case "PRZYJĘTE":
      return "var(--success-soft)";
    case "ZREALIZOWANE":
      return "var(--success-soft)";
    case "ODRZUCONE":
      return "var(--danger-soft)";
    case "ZAWIESZONE":
      return "var(--warning-soft)";
    default:
      return "var(--surface-2)";
  }
}
