import { prisma } from "@/lib/prisma";
import type { LoanFormData } from "@/lib/validations/loan";
import { validateDisbursements } from "@/lib/validations/loan";
import type { LoanType, LoanStatus, RepaymentMethod } from "@/generated/prisma/client";

export async function listLoansByScenario(scenarioId: string) {
  return prisma.loan.findMany({
    where: { scenarioId },
    include: {
      disbursementSchedule: {
        include: { milestones: { orderBy: { sequence: "asc" } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getLoanById(id: string) {
  return prisma.loan.findUnique({
    where: { id },
    include: {
      disbursementSchedule: {
        include: { milestones: { orderBy: { sequence: "asc" } } },
      },
    },
  });
}

function buildLoanData(data: LoanFormData) {
  return {
    name: data.name,
    lenderName: data.lenderName || null,
    type: data.type as LoanType,
    status: data.status as LoanStatus,
    principalAmount: data.principalAmount,
    interestRate: data.interestRatePct / 100,
    tenorMonths: data.tenorMonths,
    gracePeriodMonths: data.gracePeriodMonths ?? 0,
    startMonth: data.startMonth,
    capitalizedInterest: data.capitalizedInterest ?? false,
    repaymentMethod: data.repaymentMethod as RepaymentMethod,
    notes: data.notes || null,
  };
}

export async function createLoan(scenarioId: string, data: LoanFormData) {
  const disbResult = validateDisbursements(data.disbursementsJson);
  if (!disbResult.ok) throw new Error(disbResult.error);
  const disbItems = disbResult.items;
  const totalDisb = disbItems.reduce((s, d) => s + d.amount, 0);

  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: { scenarioId, ...buildLoanData(data) },
    });

    await tx.paymentSchedule.create({
      data: {
        scheduleType: "LOAN_DISBURSEMENT",
        name: `Giải ngân: ${data.name}`,
        totalAmount: totalDisb,
        loanDisbursementId: loan.id,
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

    return loan;
  });
}

export async function updateLoan(id: string, data: LoanFormData) {
  const disbResult = validateDisbursements(data.disbursementsJson);
  if (!disbResult.ok) throw new Error(disbResult.error);
  const disbItems = disbResult.items;
  const totalDisb = disbItems.reduce((s, d) => s + d.amount, 0);

  return prisma.$transaction(async (tx) => {
    const loan = await tx.loan.update({
      where: { id },
      data: buildLoanData(data),
    });

    const existing = await tx.paymentSchedule.findUnique({
      where: { loanDisbursementId: id },
    });

    if (existing) {
      await tx.paymentMilestone.deleteMany({ where: { scheduleId: existing.id } });
      await tx.paymentSchedule.update({
        where: { id: existing.id },
        data: {
          name: `Giải ngân: ${data.name}`,
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
          scheduleType: "LOAN_DISBURSEMENT",
          name: `Giải ngân: ${data.name}`,
          totalAmount: totalDisb,
          loanDisbursementId: loan.id,
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

    return loan;
  });
}

export async function deleteLoan(id: string) {
  return prisma.loan.delete({ where: { id } });
}
