import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getLoanById } from "@/lib/db/loans";
import LoanForm from "@/components/loan/LoanForm";
import type { RepaymentMethod, LoanType, LoanStatus } from "@/generated/prisma/client";
import { updateLoanAction } from "../../actions";

interface Props {
  params: Promise<{ id: string; scenarioId: string; loanId: string }>;
}

export const metadata: Metadata = {
  title: "Chỉnh sửa khoản vay | FS Dòng Tiền BĐS",
};

function toNum(d: { toString(): string } | null | undefined): number {
  return d != null ? parseFloat(d.toString()) : 0;
}

export default async function SuaKhoanVayPage({ params }: Props) {
  const { id: projectId, scenarioId, loanId } = await params;
  const [scenario, loan] = await Promise.all([
    getScenarioById(scenarioId),
    getLoanById(loanId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  if (!loan || loan.scenarioId !== scenarioId) notFound();

  const baseHref = `/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`;
  const action = updateLoanAction.bind(null, loanId, scenarioId, projectId);

  const milestones = loan.disbursementSchedule?.milestones ?? [];
  const disbursements = milestones.map((m) => ({
    projectMonth: m.projectMonth,
    amount: toNum(m.amount),
    description: m.description ?? "",
  }));

  const initialData = {
    name: loan.name,
    lenderName: loan.lenderName,
    type: loan.type as LoanType,
    status: loan.status as LoanStatus,
    principalAmount: toNum(loan.principalAmount),
    interestRatePct: toNum(loan.interestRate) * 100,
    tenorMonths: loan.tenorMonths,
    gracePeriodMonths: loan.gracePeriodMonths,
    startMonth: loan.startMonth,
    capitalizedInterest: loan.capitalizedInterest,
    repaymentMethod: loan.repaymentMethod as RepaymentMethod,
    disbursements: disbursements.length ? disbursements : [{ projectMonth: loan.startMonth, amount: toNum(loan.principalAmount), description: "" }],
    notes: loan.notes,
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href={baseHref}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại vốn vay
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Chỉnh sửa khoản vay</h1>
        <p className="mt-1 text-sm text-gray-500">{loan.name}</p>
      </div>

      <div className="max-w-3xl">
        <LoanForm action={action} initialData={initialData} cancelHref={baseHref} />
      </div>
    </div>
  );
}
