import { prisma } from "@/lib/prisma";
import type { LandCostFormData } from "@/lib/validations/land-cost";
import { isAreaBased } from "@/lib/validations/land-cost";
import type { LandCostCategory } from "@/generated/prisma/client";

export async function listLandCostsByScenario(scenarioId: string) {
  return prisma.landCost.findMany({
    where: { scenarioId },
    orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
  });
}

export async function getLandCostById(id: string) {
  return prisma.landCost.findUnique({ where: { id } });
}

async function nextSequence(scenarioId: string): Promise<number> {
  const agg = await prisma.landCost.aggregate({
    where: { scenarioId },
    _max: { sequence: true },
  });
  return (agg._max.sequence ?? -1) + 1;
}

function buildData(data: LandCostFormData) {
  const areaBased = isAreaBased(data.category);
  const totalAmount = areaBased
    ? Math.round(data.area! * data.unitPrice!)
    : data.totalAmount!;

  return {
    category: data.category as LandCostCategory,
    name: data.name,
    description: data.description || null,
    area: areaBased ? data.area! : null,
    unitPrice: areaBased ? data.unitPrice! : null,
    totalAmount,
    paymentMonth: data.paymentMonth,
    notes: data.notes || null,
  };
}

export async function createLandCost(scenarioId: string, data: LandCostFormData) {
  const seq = await nextSequence(scenarioId);
  return prisma.landCost.create({
    data: {
      scenarioId,
      sequence: seq,
      ...buildData(data),
    },
  });
}

export async function updateLandCost(id: string, data: LandCostFormData) {
  return prisma.landCost.update({
    where: { id },
    data: buildData(data),
  });
}

export async function deleteLandCost(id: string) {
  return prisma.landCost.delete({ where: { id } });
}
