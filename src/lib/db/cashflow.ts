import { prisma } from "@/lib/prisma";
import { aggregateCashFlow } from "@/lib/finance/cashflow";

export async function computeAndSaveCashFlow(scenarioId: string) {
  const scenario = await prisma.scenario.findUnique({
    where: { id: scenarioId },
    select: {
      id: true,
      discountRate: true,
      landCosts: {
        include: {
          paymentSchedule: {
            include: { milestones: { orderBy: { projectMonth: "asc" } } },
          },
        },
      },
      contractPackages: true,
      productGroups: {
        include: { batches: { orderBy: { sequence: "asc" } } },
      },
      loans: {
        where: { status: "ACTIVE" },
        include: {
          disbursementSchedule: {
            include: { milestones: { orderBy: { projectMonth: "asc" } } },
          },
        },
      },
      equityContributions: {
        include: {
          paymentSchedule: {
            include: { milestones: { orderBy: { projectMonth: "asc" } } },
          },
        },
      },
    },
  });

  if (!scenario) throw new Error("Kịch bản không tồn tại");

  const { rows, kpis } = aggregateCashFlow({
    discountRate: scenario.discountRate,
    landCosts: scenario.landCosts,
    contractPackages: scenario.contractPackages,
    productGroups: scenario.productGroups,
    loans: scenario.loans,
    equityContributions: scenario.equityContributions,
  });

  await prisma.$transaction(async (tx) => {
    await tx.cashFlowEntry.deleteMany({ where: { scenarioId } });

    if (rows.length > 0) {
      await tx.cashFlowEntry.createMany({
        data: rows.map((r) => ({
          scenarioId,
          projectMonth: r.projectMonth,
          revenueCollection: r.revenueCollection,
          loanDisbursement: r.loanDisbursement,
          equityInflow: r.equityInflow,
          otherInflow: r.otherInflow,
          landPayment: r.landPayment,
          constructionPayment: r.constructionPayment,
          loanRepayment: r.loanRepayment,
          interestPayment: r.interestPayment,
          taxPayment: r.taxPayment,
          otherOutflow: r.otherOutflow,
          totalInflow: r.totalInflow,
          totalOutflow: r.totalOutflow,
          netCashFlow: r.netCashFlow,
          cumulativeCashFlow: r.cumulativeCashFlow,
          computedAt: new Date(),
        })),
      });
    }

    await tx.kPISnapshot.upsert({
      where: { scenarioId },
      create: {
        scenarioId,
        totalRevenue: kpis.totalRevenue,
        totalCost: kpis.totalCost,
        grossProfit: kpis.grossProfit,
        grossMargin: kpis.grossMargin,
        netProfit: kpis.netProfit,
        netMargin: kpis.netMargin,
        irr: kpis.irr,
        npv: kpis.npv,
        roi: kpis.roi,
        paybackPeriodMonths: kpis.paybackPeriodMonths,
        peakFundingRequirement: kpis.peakFundingRequirement,
        peakFundingMonth: kpis.peakFundingMonth,
        computedAt: new Date(),
      },
      update: {
        totalRevenue: kpis.totalRevenue,
        totalCost: kpis.totalCost,
        grossProfit: kpis.grossProfit,
        grossMargin: kpis.grossMargin,
        netProfit: kpis.netProfit,
        netMargin: kpis.netMargin,
        irr: kpis.irr,
        npv: kpis.npv,
        roi: kpis.roi,
        paybackPeriodMonths: kpis.paybackPeriodMonths,
        peakFundingRequirement: kpis.peakFundingRequirement,
        peakFundingMonth: kpis.peakFundingMonth,
        computedAt: new Date(),
      },
    });
  });

  return { rowCount: rows.length, kpis };
}

export async function getCashFlowByScenario(scenarioId: string) {
  return prisma.cashFlowEntry.findMany({
    where: { scenarioId },
    orderBy: { projectMonth: "asc" },
  });
}

export async function getKPISnapshot(scenarioId: string) {
  return prisma.kPISnapshot.findUnique({ where: { scenarioId } });
}
