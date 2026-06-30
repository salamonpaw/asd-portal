"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActionResult } from "@/lib/types/actions";

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
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return { success: false, error: "Brak dostępu" };
  }

  try {
    // Total orders count
    const totalOrders = await db.serviceOrder.count();

    // Total partners
    const totalPartners = await db.partner.count();

    // Get all service orders with items and partner info
    const orders = await db.serviceOrder.findMany({
      include: {
        partner: true,
        items: true,
      },
    });

    // Calculate revenue from orders
    let totalRevenue = 0;
    const partnerMap = new Map<
      string,
      { name: string; revenue: number; orderCount: number }
    >();
    const statusMap: Record<string, number> = {};

    orders.forEach((order) => {
      // Count by status
      statusMap[order.status] = (statusMap[order.status] || 0) + 1;

      // Calculate revenue from items
      const orderRevenue = order.items.reduce((sum, item) => {
        if (item.finalPrice) {
          return sum + Number(item.finalPrice) * item.quantity;
        }
        return sum;
      }, 0);

      totalRevenue += orderRevenue;

      // Track per partner
      const partnerId = order.partnerId;
      const existing = partnerMap.get(partnerId) || {
        name: order.partner.name,
        revenue: 0,
        orderCount: 0,
      };

      partnerMap.set(partnerId, {
        name: existing.name,
        revenue: existing.revenue + orderRevenue,
        orderCount: existing.orderCount + 1,
      });
    });

    // Top partners by revenue
    const topPartners = Array.from(partnerMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        orderCount: data.orderCount,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent orders
    const recentOrders = await db.serviceOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        partner: true,
        items: true,
      },
    });

    const recentOrdersFormatted = recentOrders.map((order) => {
      const totalPrice = order.items.reduce((sum, item) => {
        if (item.finalPrice) {
          return sum + Number(item.finalPrice) * item.quantity;
        }
        return sum;
      }, 0);

      return {
        id: order.id,
        code: order.code,
        status: order.status,
        partnerName: order.partner.name,
        createdAt: order.createdAt,
        totalPrice,
      };
    });

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
    return { success: false, error: (error as Error).message };
  }
}
