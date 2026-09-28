"use server";

import { requireRole, errMsg } from "@/lib/authz";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/lib/types/actions";
import type { MachineType } from "@prisma/client";

export async function createMachineType(name: string, label: string): Promise<ActionResult<MachineType>> {
  try {
    await requireRole("ADMIN");
    const machineType = await db.machineType.create({
      data: { name, label },
    });
    revalidatePath("/admin/machine-types");
    return { success: true, data: machineType };
  } catch (error) {
    return { success: false, error: errMsg(error) };
  }
}

export async function updateMachineType(id: string, name: string, label: string): Promise<ActionResult<MachineType>> {
  try {
    await requireRole("ADMIN");
    const machineType = await db.machineType.update({
      where: { id },
      data: { name, label },
    });
    revalidatePath("/admin/machine-types");
    return { success: true, data: machineType };
  } catch (error) {
    return { success: false, error: errMsg(error) };
  }
}

export async function deleteMachineType(id: string): Promise<ActionResult<void>> {
  try {
    await requireRole("ADMIN");
    await db.machineType.delete({
      where: { id },
    });
    revalidatePath("/admin/machine-types");
    return { success: true };
  } catch (error) {
    return { success: false, error: errMsg(error) };
  }
}

export async function getMachineTypes(): Promise<ActionResult<MachineType[]>> {
  try {
    await requireRole();
    const machineTypes = await db.machineType.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, data: machineTypes };
  } catch (error) {
    return { success: false, error: errMsg(error) };
  }
}
