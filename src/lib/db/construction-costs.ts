import { prisma } from "@/lib/prisma";
import type { ConstructionCostFormData } from "@/lib/validations/construction-cost";
import type { ConstructionCostCategory } from "@/generated/prisma/client";

export async function getCostById(id: string) {
  return prisma.constructionCost.findUnique({ where: { id } });
}

async function nextSequence(packageId: string): Promise<number> {
  const agg = await prisma.constructionCost.aggregate({
    where: { packageId },
    _max: { sequence: true },
  });
  return (agg._max.sequence ?? -1) + 1;
}

function buildData(data: ConstructionCostFormData) {
  const hasQuantity = data.inputMode === "quantity";
  const totalAmount = hasQuantity
    ? Math.round(data.quantity! * data.unitPrice!)
    : data.totalAmount!;

  return {
    category: data.category as ConstructionCostCategory,
    name: data.name,
    description: data.description || null,
    unit: hasQuantity ? (data.unit || null) : null,
    quantity: hasQuantity ? data.quantity! : null,
    unitPrice: hasQuantity ? data.unitPrice! : null,
    totalAmount,
  };
}

export async function createCost(
  scenarioId: string,
  phaseId: string,
  packageId: string,
  data: ConstructionCostFormData
) {
  const seq = await nextSequence(packageId);
  return prisma.constructionCost.create({
    data: { scenarioId, phaseId, packageId, sequence: seq, ...buildData(data) },
  });
}

export async function updateCost(id: string, data: ConstructionCostFormData) {
  return prisma.constructionCost.update({
    where: { id },
    data: buildData(data),
  });
}

export async function deleteCost(id: string) {
  return prisma.constructionCost.delete({ where: { id } });
}
