import { prisma } from "@/lib/prisma";
import type { ContractPackageFormData } from "@/lib/validations/contract-package";
import type { DistributionType } from "@/generated/prisma/client";

export async function getPackageById(id: string) {
  return prisma.contractPackage.findUnique({
    where: { id },
    include: { constructionCosts: { orderBy: { sequence: "asc" } } },
  });
}

async function nextSequence(phaseId: string): Promise<number> {
  const agg = await prisma.contractPackage.aggregate({
    where: { phaseId },
    _max: { sequence: true },
  });
  return (agg._max.sequence ?? -1) + 1;
}

function buildData(data: ContractPackageFormData) {
  const customDistribution =
    data.distributionType === "MANUAL" && data.customDistribution
      ? (JSON.parse(data.customDistribution) as number[])
      : null;

  return {
    name: data.name,
    contractorName: data.contractorName || null,
    contractValue: data.contractValue,
    startMonth: data.startMonth,
    endMonth: data.endMonth,
    distributionType: data.distributionType as DistributionType,
    customDistribution: customDistribution ?? undefined,
    notes: data.notes || null,
  };
}

export async function createPackage(
  scenarioId: string,
  phaseId: string,
  data: ContractPackageFormData
) {
  const seq = await nextSequence(phaseId);
  return prisma.contractPackage.create({
    data: { scenarioId, phaseId, sequence: seq, ...buildData(data) },
  });
}

export async function updatePackage(
  id: string,
  data: ContractPackageFormData
) {
  return prisma.contractPackage.update({
    where: { id },
    data: buildData(data),
  });
}

export async function deletePackage(id: string) {
  return prisma.contractPackage.delete({ where: { id } });
}
