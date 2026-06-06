export type RepaymentMethodKey = "EQUAL_PRINCIPAL" | "ANNUITY" | "BULLET" | "CUSTOM";

export interface DisbursementItem {
  projectMonth: number;
  amount: number;
  description?: string;
}

export interface AmortizationRow {
  projectMonth: number;
  openingBalance: number;
  disbursement: number;
  principalRepayment: number;
  interest: number;
  totalPayment: number;
  closingBalance: number;
}

export interface LoanAmortizationParams {
  principalAmount: number;
  interestRate: number;        // decimal, e.g. 0.12 for 12%/năm
  tenorMonths: number;
  gracePeriodMonths: number;
  capitalizedInterest: boolean;
  repaymentMethod: RepaymentMethodKey;
  startMonth: number;
  disbursements: DisbursementItem[];
}

export interface LoanSummary {
  totalDisbursed: number;
  totalInterest: number;
  totalPrincipalRepaid: number;
  totalPayment: number;
}

function buildDisbMap(disbursements: DisbursementItem[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const d of disbursements) {
    map.set(d.projectMonth, (map.get(d.projectMonth) ?? 0) + d.amount);
  }
  return map;
}

// Tính số tiền trả đều hàng tháng (niên kim)
function computePMT(principal: number, r: number, n: number): number {
  if (r === 0 || n === 0) return principal / Math.max(n, 1);
  return principal * r / (1 - Math.pow(1 + r, -n));
}

// Tính dư nợ tích lũy sau giai đoạn ân hạn (để tính PMT chính xác)
function computeEffectivePrincipal(
  startMonth: number,
  gracePeriodMonths: number,
  capitalizedInterest: boolean,
  monthlyRate: number,
  disbMap: Map<number, number>
): number {
  if (gracePeriodMonths === 0) {
    let total = 0;
    disbMap.forEach((v) => (total += v));
    return total;
  }
  const repayStart = startMonth + gracePeriodMonths;
  let balance = 0;
  for (let m = startMonth; m < repayStart; m++) {
    balance += disbMap.get(m) ?? 0;
    if (capitalizedInterest) {
      balance += Math.round(balance * monthlyRate);
    }
  }
  return balance;
}

export function computeAmortizationSchedule(
  params: LoanAmortizationParams
): AmortizationRow[] {
  const {
    interestRate,
    tenorMonths,
    gracePeriodMonths,
    capitalizedInterest,
    repaymentMethod,
    startMonth,
    disbursements,
  } = params;

  const r = interestRate / 12;
  const repayStart = startMonth + gracePeriodMonths;
  const lastMonth = repayStart + tenorMonths - 1;

  const disbMap = buildDisbMap(disbursements);
  const effectivePrincipal = computeEffectivePrincipal(
    startMonth,
    gracePeriodMonths,
    capitalizedInterest,
    r,
    disbMap
  );

  const pmtValue =
    repaymentMethod === "ANNUITY" && effectivePrincipal > 0 && tenorMonths > 0
      ? computePMT(effectivePrincipal, r, tenorMonths)
      : 0;

  const rows: AmortizationRow[] = [];
  let balance = 0;

  const totalMonths = lastMonth - startMonth + 1;
  for (let i = 0; i < totalMonths; i++) {
    const m = startMonth + i;
    const openingBalance = balance;
    const disbursement = disbMap.get(m) ?? 0;
    balance += disbursement;

    const interest = Math.round(balance * r);
    const isGrace = m < repayStart;

    let principalRepayment = 0;
    let totalPayment = 0;

    if (isGrace) {
      if (capitalizedInterest) {
        balance += interest;
        totalPayment = 0;
      } else {
        totalPayment = interest;
      }
    } else {
      const repayIdx = m - repayStart;

      if (repaymentMethod === "EQUAL_PRINCIPAL") {
        principalRepayment =
          repayIdx < tenorMonths - 1
            ? Math.round(effectivePrincipal / tenorMonths)
            : balance;
      } else if (repaymentMethod === "ANNUITY") {
        principalRepayment =
          repayIdx < tenorMonths - 1
            ? Math.max(0, Math.round(pmtValue - interest))
            : balance;
      } else if (repaymentMethod === "BULLET") {
        principalRepayment = repayIdx === tenorMonths - 1 ? balance : 0;
      }

      principalRepayment = Math.max(0, Math.min(principalRepayment, balance));
      balance -= principalRepayment;
      totalPayment = principalRepayment + interest;
    }

    rows.push({
      projectMonth: m,
      openingBalance,
      disbursement,
      principalRepayment,
      interest,
      totalPayment,
      closingBalance: balance,
    });
  }

  return rows;
}

export function computeLoanSummary(rows: AmortizationRow[]): LoanSummary {
  let totalDisbursed = 0;
  let totalInterest = 0;
  let totalPrincipalRepaid = 0;
  let totalPayment = 0;
  for (const r of rows) {
    totalDisbursed += r.disbursement;
    totalInterest += r.interest;
    totalPrincipalRepaid += r.principalRepayment;
    totalPayment += r.totalPayment;
  }
  return { totalDisbursed, totalInterest, totalPrincipalRepaid, totalPayment };
}
