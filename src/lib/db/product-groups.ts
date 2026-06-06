import { prisma } from "@/lib/prisma";
import type { ProductGroupFormData } from "@/lib/validations/product-group";

export async function listGroupsByScenario(scenarioId: string) {
  return prisma.productGroup.findMany({
    where: { scenarioId },
    orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
    include: {
      batches: {
        orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

export async function getGroupById(id: string) {
  return prisma.productGroup.findUnique({ where: { id } });
}

export async function createGroup(scenarioId: string, data: ProductGroupFormData) {
  return prisma.productGroup.create({
    data: {
      scenarioId,
      productCode: data.productCode || null,
      name: data.name,
      productType: data.productType,
      totalUnits: data.totalUnits,
      area: data.priceUnit === "PER_SQM" ? (data.area ?? null) : null,
      basePrice: data.basePrice,
      priceUnit: data.priceUnit,
      vatRate: data.vatRate,
      notes: data.notes || null,
    },
  });
}

export async function updateGroup(id: string, data: ProductGroupFormData) {
  return prisma.productGroup.update({
    where: { id },
    data: {
      productCode: data.productCode || null,
      name: data.name,
      productType: data.productType,
      totalUnits: data.totalUnits,
      area: data.priceUnit === "PER_SQM" ? (data.area ?? null) : null,
      basePrice: data.basePrice,
      priceUnit: data.priceUnit,
      vatRate: data.vatRate,
      notes: data.notes || null,
    },
  });
}

export async function deleteGroup(id: string) {
  return prisma.productGroup.delete({ where: { id } });
}
