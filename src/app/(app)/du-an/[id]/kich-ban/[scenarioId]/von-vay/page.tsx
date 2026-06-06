import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Plus, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { listLoansByScenario } from "@/lib/db/loans";
import { listEquityByScenario } from "@/lib/db/equity-contributions";
import {
  LOAN_TYPE_LABELS,
  LOAN_STATUS_LABELS,
  REPAYMENT_METHOD_LABELS,
} from "@/lib/validations/loan";
import {
  EQUITY_SOURCE_TYPE_LABELS,
} from "@/lib/validations/equity-contribution";
import {
  computeAmortizationSchedule,
  computeLoanSummary,
} from "@/lib/finance/loan";
import type { LoanType, LoanStatus, RepaymentMethod, EquitySourceType } from "@/generated/prisma/client";
import DeleteLoanButton from "@/components/loan/DeleteLoanButton";
import DeleteEquityButton from "@/components/equity/DeleteEquityButton";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Vốn vay | FS Dòng Tiền BĐS",
};

type DecimalLike = { toString(): string };

function toNum(d: DecimalLike | null | undefined): number {
  return d != null ? parseFloat(d.toString()) : 0;
}

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";
}

export default async function VonVayPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, loans, equities] = await Promise.all([
    getScenarioById(scenarioId),
    listLoansByScenario(scenarioId),
    listEquityByScenario(scenarioId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const baseHref = `/du-an/${projectId}/kich-ban/${scenarioId}/von-vay`;

  // Tính toán tóm tắt từng khoản vay
  const loanSummaries = loans.map((loan) => {
    const milestones = loan.disbursementSchedule?.milestones ?? [];
    const disbursements = milestones.map((m) => ({
      projectMonth: m.projectMonth,
      amount: toNum(m.amount),
    }));
    const rows = disbursements.length
      ? computeAmortizationSchedule({
          principalAmount: toNum(loan.principalAmount),
          interestRate: toNum(loan.interestRate),
          tenorMonths: loan.tenorMonths,
          gracePeriodMonths: loan.gracePeriodMonths,
          capitalizedInterest: loan.capitalizedInterest,
          repaymentMethod: loan.repaymentMethod as RepaymentMethod,
          startMonth: loan.startMonth,
          disbursements,
        })
      : [];
    const summary = computeLoanSummary(rows);
    return { loan, disbursements, rows, summary };
  });

  const totalLoan = loans.reduce((s, l) => s + toNum(l.principalAmount), 0);
  const totalEquity = equities.reduce((s, e) => s + toNum(e.totalAmount), 0);
  const totalInterest = loanSummaries.reduce((s, ls) => s + ls.summary.totalInterest, 0);
  const deRatio = totalEquity > 0 ? totalLoan / totalEquity : null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/du-an/${projectId}/kich-ban/${scenarioId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại chi tiết kịch bản
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Vốn vay</h1>
            <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
          </div>
        </div>
      </div>

      {/* KPI tóm tắt */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Tổng vốn vay", value: formatVND(totalLoan) },
          { label: "Tổng góp vốn", value: formatVND(totalEquity) },
          { label: "Tổng lãi vay dự kiến", value: formatVND(totalInterest) },
          {
            label: "Tỷ lệ Nợ/Vốn (D/E)",
            value: deRatio != null ? `${deRatio.toFixed(2)}×` : "—",
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 text-base font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* ── KHOẢN VAY ── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Khoản vay</h2>
            <Link
              href={`${baseHref}/tao-moi`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Thêm khoản vay
            </Link>
          </div>

          {loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
              <p className="text-sm font-medium text-gray-700">Chưa có khoản vay</p>
              <p className="mt-1 text-sm text-gray-400">
                Thêm khoản vay ngân hàng hoặc trái phiếu cho kịch bản này.
              </p>
              <Link
                href={`${baseHref}/tao-moi`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Thêm khoản vay
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {loanSummaries.map(({ loan, disbursements, rows, summary }) => {
                const statusLabel = LOAN_STATUS_LABELS[loan.status as LoanStatus];
                const typeLabel = LOAN_TYPE_LABELS[loan.type as LoanType];
                const methodLabel = REPAYMENT_METHOD_LABELS[loan.repaymentMethod as RepaymentMethod];
                const interestRatePct = toNum(loan.interestRate) * 100;

                return (
                  <div
                    key={loan.id}
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900">{loan.name}</h3>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {typeLabel}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            loan.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : loan.status === "REPAID"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-red-100 text-red-600"
                          }`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {loan.lenderName && <>{loan.lenderName} · </>}
                          {interestRatePct % 1 === 0 ? interestRatePct.toFixed(0) : interestRatePct.toFixed(2)}%/năm ·{" "}
                          {loan.tenorMonths} tháng ·{" "}
                          {loan.gracePeriodMonths > 0 && <>Ân hạn {loan.gracePeriodMonths} tháng · </>}
                          {methodLabel} · T{loan.startMonth}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatVND(toNum(loan.principalAmount))}
                          </p>
                          <p className="text-xs text-gray-400">
                            Lãi: {formatVND(summary.totalInterest)}
                          </p>
                        </div>
                        <Link
                          href={`${baseHref}/${loan.id}/sua`}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Sửa
                        </Link>
                        <DeleteLoanButton
                          loanId={loan.id}
                          scenarioId={scenarioId}
                          projectId={projectId}
                          loanName={loan.name}
                        />
                      </div>
                    </div>

                    {/* Lịch giải ngân */}
                    {disbursements.length > 0 && (
                      <div className="px-5 py-3 border-b border-gray-100">
                        <p className="mb-2 text-xs font-medium text-gray-500">
                          Lịch giải ngân ({disbursements.length} đợt)
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {disbursements.map((d, i) => (
                            <span key={i} className="rounded bg-green-50 px-2 py-1 text-xs text-green-700">
                              T{d.projectMonth}: {formatVND(d.amount)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bảng dư nợ rút gọn (5 hàng đầu + cuối) */}
                    {rows.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-center font-semibold text-gray-500">Tháng</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-500">Dư nợ đầu kỳ</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-500">Trả gốc</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-500">Lãi vay</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-500">Tổng trả</th>
                              <th className="px-3 py-2 text-right font-semibold text-gray-500">Dư nợ cuối kỳ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 bg-white">
                            {(rows.length <= 8 ? rows : [
                              ...rows.slice(0, 4),
                              null,
                              ...rows.slice(-3),
                            ]).map((row, i) =>
                              row === null ? (
                                <tr key="ellipsis">
                                  <td colSpan={6} className="px-3 py-1.5 text-center text-gray-300 text-xs">
                                    ⋯ {rows.length - 7} tháng tiếp theo ⋯
                                  </td>
                                </tr>
                              ) : (
                                <tr key={`${row.projectMonth}-${i}`} className="hover:bg-gray-50">
                                  <td className="px-3 py-1.5 text-center text-gray-600">T{row.projectMonth}</td>
                                  <td className="px-3 py-1.5 text-right text-gray-700">
                                    {row.openingBalance > 0 ? formatVND(row.openingBalance) : "—"}
                                  </td>
                                  <td className={`px-3 py-1.5 text-right ${row.principalRepayment > 0 ? "text-red-600" : "text-gray-300"}`}>
                                    {row.principalRepayment > 0 ? formatVND(row.principalRepayment) : "—"}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-orange-700">
                                    {row.interest > 0 ? formatVND(row.interest) : "—"}
                                  </td>
                                  <td className="px-3 py-1.5 text-right font-medium text-gray-800">
                                    {row.totalPayment > 0 ? formatVND(row.totalPayment) : "—"}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-gray-700">
                                    {formatVND(row.closingBalance)}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Footer tổng khoản vay */}
                    <div className="border-t border-gray-200 bg-blue-50 px-5 py-3 flex justify-between items-center">
                      <span className="text-xs font-semibold text-blue-700">
                        Tổng khoản vay ({rows.length} tháng)
                      </span>
                      <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-xs text-blue-500">Gốc</p>
                          <p className="text-sm font-bold text-blue-900">{formatVND(toNum(loan.principalAmount))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Lãi</p>
                          <p className="text-sm font-bold text-blue-900">{formatVND(summary.totalInterest)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-500">Tổng thanh toán</p>
                          <p className="text-sm font-bold text-blue-900">{formatVND(summary.totalPayment)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── GÓP VỐN ── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Góp vốn</h2>
            <Link
              href={`${baseHref}/gop-von/tao-moi`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Thêm góp vốn
            </Link>
          </div>

          {equities.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
              <p className="text-sm font-medium text-gray-700">Chưa có mục góp vốn</p>
              <p className="mt-1 text-sm text-gray-400">
                Thêm vốn chủ sở hữu hoặc vốn từ nhà đầu tư chiến lược.
              </p>
              <Link
                href={`${baseHref}/gop-von/tao-moi`}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Thêm góp vốn
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {equities.map((eq) => {
                const milestones = eq.paymentSchedule?.milestones ?? [];
                return (
                  <div
                    key={eq.id}
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">{eq.name}</h3>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            {EQUITY_SOURCE_TYPE_LABELS[eq.sourceType as EquitySourceType]}
                          </span>
                        </div>
                        {eq.contributorName && (
                          <p className="mt-0.5 text-xs text-gray-500">{eq.contributorName}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatVND(toNum(eq.totalAmount))}
                          </p>
                          <p className="text-xs text-gray-400">{milestones.length} đợt</p>
                        </div>
                        <Link
                          href={`${baseHref}/gop-von/${eq.id}/sua`}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Sửa
                        </Link>
                        <DeleteEquityButton
                          contributionId={eq.id}
                          scenarioId={scenarioId}
                          projectId={projectId}
                          contributionName={eq.name}
                        />
                      </div>
                    </div>

                    {milestones.length > 0 && (
                      <div className="px-5 py-3">
                        <div className="flex flex-wrap gap-2">
                          {milestones.map((m) => (
                            <span key={m.id} className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                              T{m.projectMonth}: {formatVND(toNum(m.amount))}
                              {m.description && ` — ${m.description}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
