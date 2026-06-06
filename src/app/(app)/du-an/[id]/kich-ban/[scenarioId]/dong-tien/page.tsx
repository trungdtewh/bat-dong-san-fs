import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getScenarioById } from "@/lib/db/scenarios";
import { getCashFlowByScenario, getKPISnapshot } from "@/lib/db/cashflow";
import { recomputeCashFlowAction } from "./actions";
import RecomputeButton from "@/components/cashflow/RecomputeButton";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Dòng tiền | FS Dòng Tiền BĐS",
};

type DecimalLike = { toString(): string };

function n(d: DecimalLike | null | undefined): number {
  return d != null ? parseFloat(d.toString()) : 0;
}

function fmtCompact(val: number): string {
  if (val === 0) return "—";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e9) return sign + (abs / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " tỷ";
  if (abs >= 1e6) return sign + (abs / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " tr";
  return sign + Math.round(abs).toLocaleString("vi-VN");
}

function fmtVND(val: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(val)) + " ₫";
}

function fmtPct(val: number, decimals = 1): string {
  return (val * 100).toLocaleString("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + "%";
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: "default" | "green" | "red" | "blue" | "orange";
}
function KpiCard({ label, value, sub, color = "default" }: KpiCardProps) {
  const valueColors: Record<string, string> = {
    default: "text-gray-900",
    green: "text-emerald-700",
    red: "text-red-600",
    blue: "text-blue-700",
    orange: "text-orange-600",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${valueColors[color]}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── TABLE CELL HELPERS ───────────────────────────────────────────────────────

function Th({ children, align = "right" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  const cls = align === "left" ? "text-left" : align === "center" ? "text-center" : "text-right";
  return (
    <th className={`whitespace-nowrap px-3 py-2 text-xs font-semibold text-gray-500 ${cls}`}>
      {children}
    </th>
  );
}

function Td({
  val,
  highlight,
  isCumulative,
  isTotal,
}: {
  val: number;
  highlight?: "inflow" | "outflow" | "net" | "cumulative";
  isCumulative?: boolean;
  isTotal?: boolean;
}) {
  let cls = "whitespace-nowrap px-3 py-1.5 text-right text-xs ";
  if (isTotal) cls += "font-semibold ";

  if (highlight === "net") {
    cls += val > 0 ? "text-emerald-700 font-medium" : val < 0 ? "text-red-600 font-medium" : "text-gray-300";
  } else if (highlight === "cumulative") {
    cls += val > 0 ? "text-emerald-700 font-medium" : val < 0 ? "text-red-500 font-medium" : "text-gray-300";
  } else if (highlight === "inflow") {
    cls += val > 0 ? "text-blue-700" : "text-gray-300";
  } else if (highlight === "outflow") {
    cls += val > 0 ? "text-gray-700" : "text-gray-300";
  } else {
    cls += val === 0 ? "text-gray-300" : "text-gray-700";
  }

  return <td className={cls}>{fmtCompact(val)}</td>;
}

export default async function DongTienPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;

  const [scenario, entries, kpi] = await Promise.all([
    getScenarioById(scenarioId),
    getCashFlowByScenario(scenarioId),
    getKPISnapshot(scenarioId),
  ]);

  if (!scenario || scenario.projectId !== projectId) notFound();

  const baseHref = `/du-an/${projectId}/kich-ban/${scenarioId}`;
  const action = recomputeCashFlowAction.bind(null, scenarioId, projectId);

  // ─── Aggregate totals ───────────────────────────────────────────────────
  const totals = entries.reduce(
    (acc, r) => {
      acc.revenueCollection += n(r.revenueCollection);
      acc.loanDisbursement += n(r.loanDisbursement);
      acc.equityInflow += n(r.equityInflow);
      acc.otherInflow += n(r.otherInflow);
      acc.landPayment += n(r.landPayment);
      acc.constructionPayment += n(r.constructionPayment);
      acc.loanRepayment += n(r.loanRepayment);
      acc.interestPayment += n(r.interestPayment);
      acc.taxPayment += n(r.taxPayment);
      acc.otherOutflow += n(r.otherOutflow);
      acc.totalInflow += n(r.totalInflow);
      acc.totalOutflow += n(r.totalOutflow);
      acc.netCashFlow += n(r.netCashFlow);
      return acc;
    },
    {
      revenueCollection: 0, loanDisbursement: 0, equityInflow: 0, otherInflow: 0,
      landPayment: 0, constructionPayment: 0, loanRepayment: 0,
      interestPayment: 0, taxPayment: 0, otherOutflow: 0,
      totalInflow: 0, totalOutflow: 0, netCashFlow: 0,
    }
  );
  const lastCumulative = entries.length > 0 ? n(entries[entries.length - 1].cumulativeCashFlow) : 0;

  const hasData = entries.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={baseHref}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại kịch bản
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dòng tiền</h1>
            <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <RecomputeButton action={action} />
            {kpi?.computedAt && (
              <p className="text-xs text-gray-400">
                Cập nhật: {fmtDate(kpi.computedAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!hasData && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-gray-300" />
          <h3 className="mt-3 text-sm font-semibold text-gray-700">
            Chưa có dữ liệu dòng tiền
          </h3>
          <p className="mt-1.5 text-sm text-gray-500">
            Nhấn &quot;Tính toán lại&quot; để tổng hợp dòng tiền từ tất cả các module.
          </p>
          <div className="mt-5 flex justify-center">
            <RecomputeButton action={action} />
          </div>
          {!scenario.assumption && (
            <p className="mt-4 text-xs text-amber-600">
              ⚠ Chưa có giả định tài chính — NPV sẽ dùng tỷ lệ chiết khấu mặc định 12%/năm.
            </p>
          )}
          {!scenario.discountRate && (
            <p className="mt-1 text-xs text-amber-600">
              ⚠ Chưa có tỷ lệ chiết khấu trong kịch bản — NPV dùng mặc định 12%/năm.
            </p>
          )}
        </div>
      )}

      {/* KPI Cards */}
      {hasData && kpi && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Tổng doanh thu"
              value={fmtVND(n(kpi.totalRevenue))}
              color="blue"
            />
            <KpiCard
              label="Tổng chi phí"
              value={fmtVND(n(kpi.totalCost))}
              color="default"
            />
            <KpiCard
              label="Lợi nhuận gộp"
              value={fmtVND(n(kpi.grossProfit))}
              sub={`Biên: ${fmtPct(n(kpi.grossMargin))}`}
              color={n(kpi.grossProfit) >= 0 ? "green" : "red"}
            />
            <KpiCard
              label="ROI"
              value={fmtPct(n(kpi.roi))}
              sub="Lợi nhuận / Chi phí"
              color={n(kpi.roi) >= 0 ? "green" : "red"}
            />
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="IRR dự án"
              value={kpi.irr != null ? fmtPct(n(kpi.irr)) : "N/A"}
              sub="Unlevered, năm"
              color={kpi.irr != null && n(kpi.irr) > 0 ? "green" : "default"}
            />
            <KpiCard
              label="NPV"
              value={fmtVND(n(kpi.npv))}
              sub={`CK: ${n(scenario.discountRate) > 0 ? fmtPct(n(scenario.discountRate)) : "12%"}/năm`}
              color={n(kpi.npv) >= 0 ? "green" : "red"}
            />
            <KpiCard
              label="Hoàn vốn"
              value={kpi.paybackPeriodMonths != null ? `Tháng ${kpi.paybackPeriodMonths}` : "Chưa hoàn vốn"}
              sub="Dòng tiền lũy kế ≥ 0"
              color={kpi.paybackPeriodMonths != null ? "green" : "orange"}
            />
            <KpiCard
              label="Đỉnh thiếu hụt vốn"
              value={kpi.peakFundingMonth != null ? fmtVND(n(kpi.peakFundingRequirement)) : "—"}
              sub={kpi.peakFundingMonth != null ? `Tháng ${kpi.peakFundingMonth}` : "Không có"}
              color={n(kpi.peakFundingRequirement) < 0 ? "orange" : "default"}
            />
          </div>
        </>
      )}

      {/* Cash Flow Table */}
      {hasData && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Bảng dòng tiền theo tháng ({entries.length} tháng)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-gray-50">
                {/* Group header row */}
                <tr className="border-b border-gray-200">
                  <th
                    className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-center text-xs font-semibold text-gray-500"
                    rowSpan={2}
                  >
                    Tháng
                  </th>
                  <th
                    className="border-l border-gray-200 px-3 py-2 text-center text-xs font-semibold text-blue-700"
                    colSpan={4}
                  >
                    Dòng tiền vào
                  </th>
                  <th
                    className="border-l border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-700"
                    colSpan={6}
                  >
                    Dòng tiền ra
                  </th>
                  <th
                    className="border-l border-gray-200 px-3 py-2 text-center text-xs font-semibold text-gray-600"
                    colSpan={3}
                  >
                    Tổng hợp
                  </th>
                </tr>
                {/* Column header row */}
                <tr className="border-b border-gray-200">
                  <Th>Doanh thu</Th>
                  <Th>Giải ngân</Th>
                  <Th>Góp vốn</Th>
                  <Th>Tổng vào</Th>
                  <Th>CP Đất</Th>
                  <Th>CP Xây dựng</Th>
                  <Th>Trả gốc</Th>
                  <Th>Trả lãi</Th>
                  <Th>Thuế GTGT</Th>
                  <Th>Tổng ra</Th>
                  <Th>Dòng tiền thuần</Th>
                  <Th>Lũy kế</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries.map((r) => {
                  const cumVal = n(r.cumulativeCashFlow);
                  return (
                    <tr
                      key={r.id}
                      className={
                        cumVal < 0
                          ? "bg-amber-50 hover:bg-amber-100"
                          : "hover:bg-gray-50"
                      }
                    >
                      {/* Tháng — sticky */}
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 text-center font-medium text-gray-600">
                        T{r.projectMonth}
                      </td>
                      {/* Dòng tiền vào */}
                      <Td val={n(r.revenueCollection)} highlight="inflow" />
                      <Td val={n(r.loanDisbursement)} highlight="inflow" />
                      <Td val={n(r.equityInflow)} highlight="inflow" />
                      <Td val={n(r.totalInflow)} highlight="inflow" />
                      {/* Dòng tiền ra */}
                      <Td val={n(r.landPayment)} highlight="outflow" />
                      <Td val={n(r.constructionPayment)} highlight="outflow" />
                      <Td val={n(r.loanRepayment)} highlight="outflow" />
                      <Td val={n(r.interestPayment)} highlight="outflow" />
                      <Td val={n(r.taxPayment)} highlight="outflow" />
                      <Td val={n(r.totalOutflow)} highlight="outflow" />
                      {/* Tổng hợp */}
                      <Td val={n(r.netCashFlow)} highlight="net" />
                      <Td val={cumVal} highlight="cumulative" />
                    </tr>
                  );
                })}
              </tbody>
              {/* Tổng row */}
              <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                <tr>
                  <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-center text-xs font-bold text-gray-700">
                    TỔNG
                  </td>
                  <Td val={totals.revenueCollection} highlight="inflow" isTotal />
                  <Td val={totals.loanDisbursement} highlight="inflow" isTotal />
                  <Td val={totals.equityInflow} highlight="inflow" isTotal />
                  <Td val={totals.totalInflow} highlight="inflow" isTotal />
                  <Td val={totals.landPayment} highlight="outflow" isTotal />
                  <Td val={totals.constructionPayment} highlight="outflow" isTotal />
                  <Td val={totals.loanRepayment} highlight="outflow" isTotal />
                  <Td val={totals.interestPayment} highlight="outflow" isTotal />
                  <Td val={totals.taxPayment} highlight="outflow" isTotal />
                  <Td val={totals.totalOutflow} highlight="outflow" isTotal />
                  <Td val={totals.netCashFlow} highlight="net" isTotal />
                  <Td val={lastCumulative} highlight="cumulative" isTotal />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded bg-amber-100 border border-amber-200" />
              Tháng dòng tiền lũy kế âm (thiếu hụt vốn)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Dương
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Âm
            </span>
          </div>
        </div>
      )}

      {/* Warning if no discount rate */}
      {hasData && !scenario.discountRate && (
        <p className="mt-3 text-xs text-amber-600">
          ⚠ Tỷ lệ chiết khấu chưa được thiết lập trong kịch bản — NPV được tính với 12%/năm mặc định.
        </p>
      )}
    </div>
  );
}
