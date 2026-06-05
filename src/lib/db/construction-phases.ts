import { prisma } from "@/lib/prisma";
import type { ConstructionPhaseFormData } from "@/lib/validations/construction-phase";

export async function listPhasesByScenario(scenarioId: string) {
  return prisma.constructionPhase.findMany({
    where: { scenarioId },
    orderBy: [{ sequence: "asc" }, { startMonth: "asc" }],
    include: {
      packages: {
        orderBy: [{ sequence: "asc" }, { startMonth: "asc" }],
        include: { constructionCosts: { orderBy: { sequence: "asc" } } },
      },
      constructionCosts: {
        where: { packageId: null },
        orderBy: { sequence: "asc" },
      },
    },
  });
}

export async function getPhaseById(id: string) {
  return prisma.constructionPhase.findUnique({
    where: { id },
    include: {
      packages: {
        orderBy: [{ sequence: "asc" }, { startMonth: "asc" }],
        include: { constructionCosts: { orderBy: { sequence: "asc" } } },
      },
      constructionCosts: {
        where: { packageId: null },
        orderBy: { sequence: "asc" },
      },
    },
  });
}

async function nextSequence(scenarioId: string): Promise<number> {
  const agg = await prisma.constructionPhase.aggregate({
    where: { scenarioId },
    _max: { sequence: true },
  });
  return (agg._max.sequence ?? -1) + 1;
}

export async function createPhase(
  scenarioId: string,
  data: ConstructionPhaseFormData
) {
  const seq = await nextSequence(scenarioId);
  return prisma.constructionPhase.create({
    data: {
      scenarioId,
      sequence: seq,
      name: data.name,
      startMonth: data.startMonth,
      endMonth: data.endMonth,
      description: data.description || null,
    },
  });
}

export async function updatePhase(
  id: string,
  data: ConstructionPhaseFormData
) {
  return prisma.constructionPhase.update({
    where: { id },
    data: {
      name: data.name,
      startMonth: data.startMonth,
      endMonth: data.endMonth,
      description: data.description || null,
    },
  });
}

export async function deletePhase(id: string) {
  return prisma.constructionPhase.delete({ where: { id } });
}
