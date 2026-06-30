import { db } from "@/lib/db";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function checkPendingOrderReminders() {
  const today = new Date();
  const reminderWindow = addDays(today, 5);

  // Find all pending items with expectedDate within 5 days
  const itemsNeedingReminder = await db.pendingOrderItem.findMany({
    where: {
      status: "PENDING",
      expectedDate: {
        gte: startOfDay(today),
        lte: endOfDay(reminderWindow),
      },
      reminderSentAt: null,
    },
    include: {
      serviceOrder: {
        include: {
          partner: true,
          technician: true,
        },
      },
    },
  });

  if (itemsNeedingReminder.length === 0) {
    console.log("[Cron] No pending order reminders needed");
    return { success: true, processed: 0 };
  }

  // Group by service order to avoid multiple reminders per order
  const grouped = new Map<
    string,
    (typeof itemsNeedingReminder)[0][]
  >();
  itemsNeedingReminder.forEach((item) => {
    const key = item.serviceOrderId;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  let processedCount = 0;

  for (const [, items] of grouped) {
    const firstItem = items[0];
    const order = firstItem.serviceOrder;
    const daysUntil = Math.ceil(
      (firstItem.expectedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Log reminder (in production, send email/notification)
    console.log(
      `[Cron Reminder] Order ${order.code} - ${items.length} items due in ${daysUntil} days`
    );
    console.log(
      `  Partner: ${order.partner.name} (${order.partner.email})`
    );
    console.log(
      `  Technician: ${order.technician.name} (${order.technician.email})`
    );

    // Mark all items as reminder sent
    await db.pendingOrderItem.updateMany({
      where: {
        serviceOrderId: order.id,
        reminderSentAt: null,
      },
      data: {
        reminderSentAt: new Date(),
      },
    });

    // Log history entry
    await db.serviceOrderHistory.create({
      data: {
        serviceOrderId: order.id,
        changedBy: "SYSTEM",
        action: "REMINDER_SENT",
        notes: `${items.length} pending items - expected in ${daysUntil} days`,
      },
    });

    processedCount++;
  }

  console.log(
    `[Cron] Processed ${processedCount} orders with pending item reminders`
  );
  return { success: true, processed: processedCount };
}
