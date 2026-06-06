import type {
  LandCost,
  ContractPackage,
  ProductGroup,
  ProductBatch,
  Loan,
  EquityContribution,
  PaymentSchedule,
  PaymentMilestone,
} from "@/generated/prisma/client";
import { computeAmortizationSchedule } from "./loan";
import type { RepaymentMethodKey } from "./loan";
import { computeCollectionCashFlow } from "./revenue";
import type { CollectionInstallment } from "./revenue";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface CashFlowRow {
  projectMonth: number;
  revenueCollection: number;
  loanDisbursement: number;
  equityInflow: number;
  otherInflow: number;
  landPayment: number;
  constructionPayment: number;
  loanRepayment: number;
  interestPayment: number;
  taxPayment: number;
  otherOutflow: number;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

export interface CashFlowKPIs {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  grossMargin: number;
  netProfit: number;
  netMargin: number;
  irr: number | null;
  npv: number;
  roi: number;
  paybackPeriodMonths: number | null;
  peakFundingRequirement: number;
  peakFundingMonth: number | null;
}

type WithMilestones = PaymentSchedule & { milestones: PaymentMilestone[] };

export interface ScenarioCashFlowInput {
  discountRate: { toString(): string } | null | undefined;
  landCosts: (LandCost & { paymentSchedule: WithMilestones | null })[];
  contractPackages: ContractPackage[];
  productGroups: (ProductGroup & { batches: ProductBatch[] })[];
  loans: (Loan & { disbursementSchedule: WithMilestones | null })[];
  equityContributions: (EquityContribution & { paymentSchedule: WithMilestones | null })[];
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function toNum(d: { toString(): string } | null | undefined): number {
  return d != null ? parseFloat(d.toString()) : 0;
}

function normalPDF(x: number, mean: number, std: number): number {
  if (std <= 0) return 0;
  const z = (x - mean) / std;
  return Math.exp(-0.5 * z * z);
}

// ─── CONSTRUCTION PAYMENT DISTRIBUTION ───────────────────────────────────────

function distributeContractPayments(pkg: ContractPackage): Map<number, number> {
  const result = new Map<number, number>();
  const value = toNum(pkg.contractValue);
  if (value <= 0) return result;
  const { startMonth, endMonth, distributionType, customDistribution } = pkg;
  if (startMonth > endMonth) return result;
  const duration = endMonth - startMonth + 1;

  let weights: number[];

  switch (distributionType) {
    case "FRONT_LOADED":
      weights = Array.from({ length: duration }, (_, i) => duration - i);
      break;
    case "BACK_LOADED":
      weights = Array.from({ length: duration }, (_, i) => i + 1);
      break;
    case "S_CURVE": {
      const mean = (duration - 1) / 2;
      const std = Math.max(duration / 4, 0.5);
      weights = Array.from({ length: duration }, (_, i) => normalPDF(i, mean, std));
      break;
    }
    case "MANUAL": {
      if (customDistribution) {
        try {
          const dist = customDistribution as Record<string, number>;
          const w = Array.from({ length: duration }, (_, i) => dist[String(i)] ?? 0);
          if (w.some((v) => v > 0)) { weights = w; break; }
        } catch {}
      }
      weights = Array.from({ length: duration }, () => 1);
      break;
    }
    default: // UNIFORM
      weights = Array.from({ length: duration }, () => 1);
  }

  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return result;

  let distributed = 0;
  for (let i = 0; i < duration - 1; i++) {
    const amount = Math.round((value * weights[i]) / total);
    result.set(startMonth + i, (result.get(startMonth + i) ?? 0) + amount);
    distributed += amount;
  }
  result.set(endMonth, (result.get(endMonth) ?? 0) + (value - distributed));
  return result;
}

// ─── MILESTONE AGGREGATION ───────────────────────────────────────────────────

function milestonesToMap(schedule: WithMilestones | null | undefined): Map<number, number> {
  const map = new Map<number, number>();
  if (!schedule) return map;
  for (const m of schedule.milestones) {
    const amount = toNum(m.amount);
    if (amount > 0) map.set(m.projectMonth, (map.get(m.projectMonth) ?? 0) + amount);
  }
  return map;
}

// ─── MAIN AGGREGATION ────────────────────────────────────────────────────────

type MonthData = Omit<
  CashFlowRow,
  "projectMonth" | "totalInflow" | "totalOutflow" | "netCashFlow" | "cumulativeCashFlow"
>;

function emptyMonth(): MonthData {
  return {
    revenueCollection: 0, loanDisbursement: 0, equityInflow: 0, otherInflow: 0,
    landPayment: 0, constructionPayment: 0, loanRepayment: 0,
    interestPayment: 0, taxPayment: 0, otherOutflow: 0,
  };
}

export function aggregateCashFlow(input: ScenarioCashFlowInput): {
  rows: CashFlowRow[];
  kpis: CashFlowKPIs;
} {
  const months = new Map<number, MonthData>();

  const ensure = (m: number): MonthData => {
    if (!months.has(m)) months.set(m, emptyMonth());
    return months.get(m)!;
  };

  const add = (m: number, field: keyof MonthData, value: number) => {
    ensure(m)[field] += value;
  };

  // A. Chi phí đất
  for (const lc of input.landCosts) {
    milestonesToMap(lc.paymentSchedule).forEach((amt, m) =>
      add(m, "landPayment", amt)
    );
  }

  // B. Chi phí xây dựng từ ContractPackage
  for (const pkg of input.contractPackages) {
    distributeContractPayments(pkg).forEach((amt, m) =>
      add(m, "constructionPayment", amt)
    );
  }

  // C. Doanh thu + Thuế GTGT
  for (const group of input.productGroups) {
    const vatRate = toNum(group.vatRate);
    const priceContext = {
      priceUnit: group.priceUnit,
      area: group.area,
      basePrice: toNum(group.basePrice),
    };
    for (const batch of group.batches) {
      let schedule: CollectionInstallment[];
      try {
        const raw = batch.collectionSchedule;
        if (!Array.isArray(raw) || raw.length === 0) continue;
        schedule = raw as unknown as CollectionInstallment[];
      } catch { continue; }

      const revMap = computeCollectionCashFlow(
        priceContext,
        toNum(batch.priceAdjustmentRate),
        batch.unitsOffered,
        toNum(batch.salesVelocity),
        batch.launchMonth,
        schedule
      );
      revMap.forEach((amt, m) => {
        add(m, "revenueCollection", amt);
        if (vatRate > 0) add(m, "taxPayment", Math.round(amt * vatRate));
      });
    }
  }

  // D. Giải ngân vay
  for (const loan of input.loans) {
    milestonesToMap(loan.disbursementSchedule).forEach((amt, m) =>
      add(m, "loanDisbursement", amt)
    );
  }

  // E. Trả gốc + Trả lãi (tính từ amortization, không lưu DB)
  for (const loan of input.loans) {
    if (loan.status !== "ACTIVE") continue;
    const disbItems =
      loan.disbursementSchedule?.milestones.map((m) => ({
        projectMonth: m.projectMonth,
        amount: toNum(m.amount),
      })) ?? [];
    const rows = computeAmortizationSchedule({
      principalAmount: toNum(loan.principalAmount),
      interestRate: toNum(loan.interestRate),
      tenorMonths: loan.tenorMonths,
      gracePeriodMonths: loan.gracePeriodMonths,
      capitalizedInterest: loan.capitalizedInterest,
      repaymentMethod: loan.repaymentMethod as RepaymentMethodKey,
      startMonth: loan.startMonth,
      disbursements: disbItems,
    });
    for (const row of rows) {
      if (row.principalRepayment > 0) add(row.projectMonth, "loanRepayment", row.principalRepayment);
      if (row.interest > 0) add(row.projectMonth, "interestPayment", row.interest);
    }
  }

  // F. Góp vốn
  for (const eq of input.equityContributions) {
    milestonesToMap(eq.paymentSchedule).forEach((amt, m) =>
      add(m, "equityInflow", amt)
    );
  }

  if (months.size === 0) return { rows: [], kpis: emptyKPIs() };

  // ─── Build sorted rows + cumulative ──────────────────────────────────────
  let cumulative = 0;
  const rows: CashFlowRow[] = [...months.keys()]
    .sort((a, b) => a - b)
    .map((m) => {
      const d = months.get(m)!;
      const totalInflow = d.revenueCollection + d.loanDisbursement + d.equityInflow + d.otherInflow;
      const totalOutflow =
        d.landPayment + d.constructionPayment + d.loanRepayment +
        d.interestPayment + d.taxPayment + d.otherOutflow;
      const net = totalInflow - totalOutflow;
      cumulative += net;
      return { projectMonth: m, ...d, totalInflow, totalOutflow, netCashFlow: net, cumulativeCashFlow: cumulative };
    });

  const kpis = computeKPIs(rows, toNum(input.discountRate));
  return { rows, kpis };
}

// ─── KPI COMPUTATION ─────────────────────────────────────────────────────────

function emptyKPIs(): CashFlowKPIs {
  return {
    totalRevenue: 0, totalCost: 0, grossProfit: 0, grossMargin: 0,
    netProfit: 0, netMargin: 0, irr: null, npv: 0, roi: 0,
    paybackPeriodMonths: null, peakFundingRequirement: 0, peakFundingMonth: null,
  };
}

export function computeKPIs(rows: CashFlowRow[], annualDiscountRate: number): CashFlowKPIs {
  if (rows.length === 0) return emptyKPIs();

  const totalRevenue = rows.reduce((s, r) => s + r.revenueCollection, 0);
  const totalCost = rows.reduce(
    (s, r) => s + r.landPayment + r.constructionPayment + r.interestPayment + r.taxPayment + r.otherOutflow,
    0
  );
  const grossProfit = totalRevenue - totalCost;
  const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

  // Project IRR (unlevered): chỉ dùng operating CF, không gồm vay/trả/góp vốn
  const projectCF = rows.map(
    (r) => r.revenueCollection - r.landPayment - r.constructionPayment - r.taxPayment - r.otherOutflow
  );
  const rate = annualDiscountRate > 0 ? annualDiscountRate : 0.12;
  const irr = computeIRR(projectCF);
  const npv = computeNPV(projectCF, rate);
  const roi = totalCost > 0 ? grossProfit / totalCost : 0;

  const paybackRow = rows.find((r) => r.cumulativeCashFlow >= 0);

  let peakFunding = 0;
  let peakMonth: number | null = null;
  for (const r of rows) {
    if (r.cumulativeCashFlow < peakFunding) {
      peakFunding = r.cumulativeCashFlow;
      peakMonth = r.projectMonth;
    }
  }

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    grossMargin,
    netProfit: grossProfit,
    netMargin: grossMargin,
    irr,
    npv,
    roi,
    paybackPeriodMonths: paybackRow?.projectMonth ?? null,
    peakFundingRequirement: peakFunding,
    peakFundingMonth: peakMonth,
  };
}

// ─── IRR — bisection method ───────────────────────────────────────────────────

export function computeIRR(monthlyCF: number[]): number | null {
  const hasPos = monthlyCF.some((v) => v > 0);
  const hasNeg = monthlyCF.some((v) => v < 0);
  if (!hasPos || !hasNeg) return null;

  const npv = (r: number) =>
    monthlyCF.reduce((s, cf, t) => s + cf / Math.pow(1 + r, t + 1), 0);

  let lo = -0.9999;
  let hi = 5.0;
  if (npv(lo) * npv(hi) > 0) {
    hi = 0.5;
    if (npv(lo) * npv(hi) > 0) return null;
  }

  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid; else hi = mid;
    if (hi - lo < 1e-10) return Math.pow(1 + (lo + hi) / 2, 12) - 1;
  }
  return null;
}

// ─── NPV ─────────────────────────────────────────────────────────────────────

export function computeNPV(monthlyCF: number[], annualRate: number): number {
  const r = annualRate / 12;
  return Math.round(
    monthlyCF.reduce((sum, cf, t) => sum + cf / Math.pow(1 + r, t + 1), 0)
  );
}
