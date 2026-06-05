import { prisma } from "@/lib/prisma";
import type { AssumptionFormData } from "@/lib/validations/assumption";

export async function getAssumptionByScenarioId(scenarioId: string) {
  return prisma.assumption.findUnique({ where: { scenarioId } });
}

function toDecimalOrNull(value: number | undefined): number | null {
  return value != null ? value / 100 : null;
}

function buildAssumptionData(data: AssumptionFormData) {
  return {
    inflationRate: data.inflationRate / 100,
    priceEscalationRate: toDecimalOrNull(data.priceEscalationRate),
    constructionEscalationRate: toDecimalOrNull(data.constructionEscalationRate),
    landPriceEscalationRate: toDecimalOrNull(data.landPriceEscalationRate),
    corporateTaxRate: data.corporateTaxRate / 100,
    vatRate: data.vatRate / 100,
    landTransferTaxRate: toDecimalOrNull(data.landTransferTaxRate),
    salesCommissionRate: data.salesCommissionRate / 100,
    marketingCostRate: toDecimalOrNull(data.marketingCostRate),
    contingencyRate: data.contingencyRate / 100,
    debtRatio: toDecimalOrNull(data.debtRatio),
    equityRatio: toDecimalOrNull(data.equityRatio),
    loanInterestRate: toDecimalOrNull(data.loanInterestRate),
    loanTenorMonths: data.loanTenorMonths ?? null,
    gracePeriodMonths: data.gracePeriodMonths ?? null,
    notes: data.notes ?? null,
  };
}

export async function upsertAssumption(
  scenarioId: string,
  data: AssumptionFormData
) {
  const fields = buildAssumptionData(data);
  return prisma.assumption.upsert({
    where: { scenarioId },
    create: { scenarioId, ...fields },
    update: fields,
  });
}
