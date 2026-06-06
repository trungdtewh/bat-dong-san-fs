import { prisma } from "@/lib/prisma";
import type { ProductBatchFormData } from "@/lib/validations/product-batch";
import type { CollectionInstallment } from "@/lib/validations/product-batch";

function buildData(groupId: string, scenarioId: string, data: ProductBatchFormData) {
  const schedule = JSON.parse(data.collectionScheduleJson) as CollectionInstallment[];
  return {
    groupId,
    scenarioId,
    name: data.name,
    launchMonth: data.launchMonth,
    unitsOffered: data.unitsOffered,
    priceAdjustmentRate: data.priceAdjustmentRate,
    salesVelocity: data.salesVelocity,
    collectionSchedule: JSON.parse(JSON.stringify(schedule)),
    notes: data.notes || null,
  };
}

export async function getBatchById(id: string) {
  return prisma.productBatch.findUnique({ where: { id } });
}

export async function createBatch(
  groupId: string,
  scenarioId: string,
  data: ProductBatchFormData
) {
  return prisma.productBatch.create({ data: buildData(groupId, scenarioId, data) });
}

export async function updateBatch(id: string, groupId: string, scenarioId: string, data: ProductBatchFormData) {
  return prisma.productBatch.update({
    where: { id },
    data: buildData(groupId, scenarioId, data),
  });
}

export async function deleteBatch(id: string) {
  return prisma.productBatch.delete({ where: { id } });
}
