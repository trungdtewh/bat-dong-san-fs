import { prisma } from "@/lib/prisma";
import type { EquityContributionFormData } from "@/lib/validations/equity-contribution";
import { validateEquityDisbursements } from "@/lib/validations/equity-contribution";
import type { EquitySourceType } from "@/generated/prisma/client";

export async function listEquityByScenario(scenarioId: string) {
  return prisma.equityContribution.findMany({
    where: { scenarioId },
    include: {
      paymentSchedule: {
        include: { milestones: { orderBy: { sequence: "asc" } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getEquityById(id: string) {
  return prisma.equityContribution.findUnique({
    where: { id },
    include: {
      paymentSchedule: {
        include: { milestones: { orderBy: { sequence: "asc" } } },
      },
    },
  });
}

function buildEquityData(data: EquityContributionFormData) {
  return {
    name: data.name,
    contributorName: data.contributorName || null,
    sourceType: data.sourceType as EquitySourceType,
    totalAmount: data.totalAmount,
    notes: data.notes || null,
  };
}

export async function createEquity(
  scenarioId: string,
  data: EquityContributionFormData
) {
  const disbResult = validateEquityDisbursements(data.disbursementsJson);
  if (!disbResult.ok) throw new Error(disbResult.error);
  const disbItems = disbResult.items;
  const totalDisb = disbItems.reduce((s, d) => s + d.amount, 0);

  return prisma.$transaction(async (tx) => {
    const equity = await tx.equityContribution.create({
      data: { scenarioId, ...buildEquityData(data) },
    });

    await tx.paymentSchedule.create({
      data: {
        scheduleType: "EQUITY_CONTRIBUTION",
        name: `Góp vốn: ${data.name}`,
        totalAmount: totalDisb,
        equityContributionId: equity.id,
        milestones: {
          create: disbItems.map((d, i) => ({
            sequence: i,
            projectMonth: d.projectMonth,
            amount: d.amount,
            description: d.description || null,
          })),
        },
      },
    });

    return equity;
  });
}

export async function updateEquity(
  id: string,
  data: EquityContributionFormData
) {
  const disbResult = validateEquityDisbursements(data.disbursementsJson);
  if (!disbResult.ok) throw new Error(disbResult.error);
  const disbItems = disbResult.items;
  const totalDisb = disbItems.reduce((s, d) => s + d.amount, 0);

  return prisma.$transaction(async (tx) => {
    const equity = await tx.equityContribution.update({
      where: { id },
      data: buildEquityData(data),
    });

    const existing = await tx.paymentSchedule.findUnique({
      where: { equityContributionId: id },
    });

    if (existing) {
      await tx.paymentMilestone.deleteMany({ where: { scheduleId: existing.id } });
      await tx.paymentSchedule.update({
        where: { id: existing.id },
        data: {
          name: `Góp vốn: ${data.name}`,
          totalAmount: totalDisb,
          milestones: {
            create: disbItems.map((d, i) => ({
              sequence: i,
              projectMonth: d.projectMonth,
              amount: d.amount,
              description: d.description || null,
            })),
          },
        },
      });
    } else {
      await tx.paymentSchedule.create({
        data: {
          scheduleType: "EQUITY_CONTRIBUTION",
          name: `Góp vốn: ${data.name}`,
          totalAmount: totalDisb,
          equityContributionId: equity.id,
          milestones: {
            create: disbItems.map((d, i) => ({
              sequence: i,
              projectMonth: d.projectMonth,
              amount: d.amount,
              description: d.description || null,
            })),
          },
        },
      });
    }

    return equity;
  });
}

export async function deleteEquity(id: string) {
  return prisma.equityContribution.delete({ where: { id } });
}
