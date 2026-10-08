"use server";

import { errMsg } from "@/lib/authz";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActionResult } from "@/lib/types/actions";
import { orderView, toPln, num, round2 } from "@/lib/pricing";
import { itemNumbers } from "@/lib/service-orders/server";

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalPartners: number;
  topPartners: Array<{
    id: string;
    name: string;
    orderCount: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    code: string;
    status: string;
    partnerName: string;
    createdAt: Date;
    totalPrice: number;
  }>;
  ordersByStatus: Record<string, number>;
}

export async function getAdminDashboardStats(): Promise<ActionResult<DashboardStats>> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    // Total orders count
    const totalOrders = await db.serviceOrder.count();

    // Total partners
    const totalPartners = await db.partner.count();

    // Obroty: tylko zamówienia zrealizowane, w PLN (kurs zapisany przy wycenie) — wspólne liczenie z lib/pricing
    const orders = await db.serviceOrder.findMany({
      include: { partner: { select: { name: true } }, items: true },
      orderBy: { createdAt: "desc" },
    });
    const REALIZED = ["ZREALIZOWANE", "CZĘŚCIOWO_ZREALIZOWANE"];
    const plnTotal = (o: (typeof orders)[number]) => toPln(orderView(o.items.map(itemNumbers)).total, num(o.exchangeRate) ?? 1);

    let totalRevenue = 0;
    const partnerMap = new Map<string, { name: string; revenue: number; orderCount: number }>();
    const statusMap: Record<string, number> = {};

    for (const order of orders) {
      statusMap[order.status] = (statusMap[order.status] || 0) + 1;
      const revenue = REALIZED.includes(order.status) ? plnTotal(order) : 0;
      totalRevenue += revenue;
      const p = partnerMap.get(order.partnerId) ?? { name: order.partner.name, revenue: 0, orderCount: 0 };
      partnerMap.set(order.partnerId, { name: p.name, revenue: p.revenue + revenue, orderCount: p.orderCount + 1 });
    }

    const topPartners = [...partnerMap.entries()]
      .map(([id, d]) => ({ id, name: d.name, orderCount: d.orderCount, revenue: round2(d.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const recentOrdersFormatted = orders.slice(0, 10).map((order) => ({
      id: order.id,
      code: order.code,
      status: order.status,
      partnerName: order.partner.name,
      createdAt: order.createdAt,
      totalPrice: plnTotal(order),
    }));
    totalRevenue = round2(totalRevenue);

    return {
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalPartners,
        topPartners,
        recentOrders: recentOrdersFormatted,
        ordersByStatus: statusMap,
      },
    };
  } catch (error) {
    return { success: false, error: errMsg(error) };
  }
}
