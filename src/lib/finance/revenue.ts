import type { PriceUnit } from "@/generated/prisma/client";

export interface GroupPriceContext {
  priceUnit: PriceUnit;
  area: number | null;
  basePrice: number;
}

export interface CollectionInstallment {
  percent: number;
  offsetMonths: number;
  label: string;
}

// Đơn giá căn gốc (chưa điều chỉnh theo đợt)
export function computeBaseUnitPrice(group: GroupPriceContext): number {
  if (group.priceUnit === "PER_SQM") {
    const area = group.area ?? 0;
    return area * group.basePrice;
  }
  return group.basePrice;
}

// Đơn giá căn sau điều chỉnh giá của đợt
export function computeBatchUnitPrice(
  group: GroupPriceContext,
  priceAdjustmentRate: number
): number {
  const base = computeBaseUnitPrice(group);
  return Math.round(base * (1 + priceAdjustmentRate));
}

// Tổng doanh thu đợt (chưa VAT)
export function computeBatchRevenue(
  group: GroupPriceContext,
  priceAdjustmentRate: number,
  unitsOffered: number
): number {
  return computeBatchUnitPrice(group, priceAdjustmentRate) * unitsOffered;
}

// Số tháng bán hết
export function computeAbsorptionMonths(
  unitsOffered: number,
  salesVelocity: number
): number {
  if (salesVelocity <= 0) return 0;
  return Math.ceil(unitsOffered / salesVelocity);
}

// Phân bổ số căn bán theo từng tháng (relative: 0 = launchMonth)
export function computeMonthlySales(
  unitsOffered: number,
  salesVelocity: number
): number[] {
  if (salesVelocity <= 0 || unitsOffered <= 0) return [];
  const months: number[] = [];
  let remaining = unitsOffered;
  while (remaining > 0) {
    const sold = Math.min(salesVelocity, remaining);
    months.push(sold);
    remaining -= sold;
  }
  return months;
}

// Dòng tiền thu theo tháng dự án
// Trả về Map<tháng dự án, số tiền thu>
export function computeCollectionCashFlow(
  group: GroupPriceContext,
  priceAdjustmentRate: number,
  unitsOffered: number,
  salesVelocity: number,
  launchMonth: number,
  schedule: CollectionInstallment[]
): Map<number, number> {
  const unitPrice = computeBatchUnitPrice(group, priceAdjustmentRate);
  const monthlySales = computeMonthlySales(unitsOffered, salesVelocity);
  const cashFlow = new Map<number, number>();

  monthlySales.forEach((unitsSold, relMonth) => {
    const saleMonth = launchMonth + relMonth;
    for (const inst of schedule) {
      const collectMonth = saleMonth + inst.offsetMonths;
      const amount = Math.round(unitPrice * unitsSold * (inst.percent / 100));
      cashFlow.set(collectMonth, (cashFlow.get(collectMonth) ?? 0) + amount);
    }
  });

  return cashFlow;
}
