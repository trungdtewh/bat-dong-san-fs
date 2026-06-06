import { prisma } from "@/lib/prisma";
import type { ScenarioFormData } from "@/lib/validations/scenario";

export async function listScenariosByProject(projectId: string) {
  return prisma.scenario.findMany({
    where: { projectId, isActive: true },
    orderBy: [{ isBase: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      type: true,
      isBase: true,
      description: true,
      version: true,
      parentScenarioId: true,
      durationMonths: true,
      discountRate: true,
      createdAt: true,
    },
  });
}

export type ScenarioListItem = Awaited<
  ReturnType<typeof listScenariosByProject>
>[number];

export async function getScenarioById(id: string) {
  return prisma.scenario.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, name: true, code: true, startDate: true, endDate: true },
      },
      assumption: true,
      parentScenario: { select: { id: true, name: true } },
      childScenarios: {
        where: { isActive: true },
        select: { id: true, name: true, type: true, isBase: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getBaseScenario(projectId: string) {
  return prisma.scenario.findFirst({
    where: { projectId, isBase: true, isActive: true },
    select: { id: true, name: true },
  });
}

export async function createScenario(projectId: string, data: ScenarioFormData) {
  if (data.isBase) {
    const existing = await getBaseScenario(projectId);
    if (existing) throw new Error("BASE_EXISTS");
  }

  return prisma.scenario.create({
    data: {
      projectId,
      name: data.name,
      type: data.type,
      isBase: data.isBase,
      description: data.description ?? null,
      durationMonths: data.durationMonths ?? null,
      constructionStartMonth: data.constructionStartMonth ?? null,
      salesStartMonth: data.salesStartMonth ?? null,
      handoverStartMonth: data.handoverStartMonth ?? null,
      discountRate: data.discountRate != null ? data.discountRate / 100 : null,
    },
  });
}

export async function updateScenario(id: string, data: ScenarioFormData) {
  const scenario = await prisma.scenario.findUnique({
    where: { id },
    select: { projectId: true, isBase: true },
  });

  if (!scenario) throw new Error("NOT_FOUND");

  if (data.isBase && !scenario.isBase) {
    const existing = await getBaseScenario(scenario.projectId);
    if (existing && existing.id !== id) throw new Error("BASE_EXISTS");
  }

  return prisma.scenario.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      isBase: data.isBase,
      description: data.description ?? null,
      durationMonths: data.durationMonths ?? null,
      constructionStartMonth: data.constructionStartMonth ?? null,
      salesStartMonth: data.salesStartMonth ?? null,
      handoverStartMonth: data.handoverStartMonth ?? null,
      discountRate: data.discountRate != null ? data.discountRate / 100 : null,
    },
  });
}

export async function deleteScenario(id: string) {
  return prisma.scenario.delete({ where: { id } });
}

export async function getScenarioFullReport(id: string) {
  return prisma.scenario.findUnique({
    where: { id },
    include: {
      project: true,
      assumption: true,
      kpiSnapshot: true,
      cashFlowEntries: { orderBy: { projectMonth: "asc" } },
      landCosts: {
        orderBy: [{ sequence: "asc" }, { createdAt: "asc" }],
      },
      constructionPhases: {
        include: {
          packages: { orderBy: [{ sequence: "asc" }, { startMonth: "asc" }] },
        },
        orderBy: [{ sequence: "asc" }, { startMonth: "asc" }],
      },
      productGroups: {
        include: { batches: { orderBy: { sequence: "asc" } } },
        orderBy: { sequence: "asc" },
      },
      loans: { orderBy: { createdAt: "asc" } },
      equityContributions: { orderBy: { createdAt: "asc" } },
    },
  });
}

export type ScenarioFullReport = NonNullable<
  Awaited<ReturnType<typeof getScenarioFullReport>>
>;

export async function cloneScenario(id: string) {
  const original = await prisma.scenario.findUnique({
    where: { id },
    select: {
      projectId: true,
      name: true,
      type: true,
      description: true,
      durationMonths: true,
      constructionStartMonth: true,
      salesStartMonth: true,
      handoverStartMonth: true,
      discountRate: true,
    },
  });

  if (!original) throw new Error("NOT_FOUND");

  return prisma.scenario.create({
    data: {
      projectId: original.projectId,
      name: `Sao chép — ${original.name}`,
      type: original.type,
      description: original.description,
      isBase: false,
      version: 1,
      parentScenarioId: id,
      durationMonths: original.durationMonths,
      constructionStartMonth: original.constructionStartMonth,
      salesStartMonth: original.salesStartMonth,
      handoverStartMonth: original.handoverStartMonth,
      discountRate: original.discountRate,
    },
  });
}
