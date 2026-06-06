import { Fragment } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioFullReport } from "@/lib/db/scenarios";
import PrintButton from "@/components/cashflow/PrintButton";
import { LAND_COST_CATEGORY_LABELS } from "@/lib/validations/land-cost";
import { REVENUE_PRODUCT_TYPE_LABELS } from "@/lib/validations/product-group";
import { LOAN_TYPE_LABELS, REPAYMENT_METHOD_LABELS } from "@/lib/validations/loan";
import { EQUITY_SOURCE_TYPE_LABELS } from "@/lib/validations/equity-contribution";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scenarioId } = await params;
  const data = await getScenarioFullReport(scenarioId);
  return {
    title: data ? `Báo cáo — ${data.name} | FS BĐS` : "Báo cáo | FS BĐS",
  };
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────────

function fVND(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";
}

function fBillion(n: number | null | undefined): string {
  if (n == null) return "—";
  const b = n / 1_000_000_000;
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(b) + " tỷ";
}

function fPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return (n * 100).toFixed(2) + "%";
}

function toNum(d: { toString(): string } | null | undefined): number {
  return d != null ? parseFloat(d.toString()) : 0;
}

function printDate() {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date());
}

// ─── SECTION COMPONENTS ───────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 mb-3 border-b-2 border-gray-800 pb-1 text-base font-bold uppercase tracking-wide text-gray-800 print:mt-6">
      {children}
    </h2>
  );
}

function KpiGrid({ items }: { items: { label: string; value: string; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-gray-200 bg-gray-50 p-3 print:border-gray-300 print:p-2"
        >
          <p className="text-xs text-gray-500">{item.label}</p>
          <p className="mt-0.5 text-sm font-bold text-gray-900">{item.value}</p>
          {item.sub && <p className="text-xs text-gray-400">{item.sub}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function BaoCaoPage({ params }: Props) {
  const { id, scenarioId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const data = await getScenarioFullReport(scenarioId);
  if (!data || data.projectId !== id) notFound();
  await assertProjectAccess(session.user.id, id).catch(() => notFound());

  const kpi = data.kpiSnapshot;
  const entries = data.cashFlowEntries;

  // ─── Tóm tắt điều hành ────────────────────────────────────────────────────

  const totalRevenue   = kpi ? toNum(kpi.totalRevenue)            : entries.reduce((s, e) => s + toNum(e.revenueCollection), 0);
  const totalCost      = kpi ? toNum(kpi.totalCost)               : entries.reduce((s, e) => s + toNum(e.landPayment) + toNum(e.constructionPayment) + toNum(e.interestPayment) + toNum(e.taxPayment) + toNum(e.otherOutflow), 0);
  const grossProfit    = totalRevenue - totalCost;
  const irr            = kpi ? toNum(kpi.irr)                     : null;
  const npv            = kpi ? toNum(kpi.npv)                     : null;
  const roi            = kpi ? toNum(kpi.roi)                     : null;
  const paybackMonth   = kpi?.paybackPeriodMonths                  ?? null;
  const peakFunding    = kpi ? toNum(kpi.peakFundingRequirement)  : null;
  const peakMonth      = kpi?.peakFundingMonth                     ?? null;

  const executiveSummary = [
    { label: "Tổng doanh thu",           value: fBillion(totalRevenue) },
    { label: "Tổng chi phí",             value: fBillion(totalCost) },
    { label: "Lợi nhuận gộp",            value: fBillion(grossProfit) },
    { label: "ROI",                       value: roi != null ? fPct(roi) : "—" },
    { label: "IRR (năm)",                 value: irr != null ? fPct(irr) : "—" },
    { label: "NPV",                       value: npv != null ? fBillion(npv) : "—" },
    { label: "Tháng hoàn vốn",           value: paybackMonth != null ? `Tháng ${paybackMonth}` : "—" },
    { label: "Nhu cầu vốn đỉnh điểm",   value: peakFunding != null ? fBillion(Math.abs(peakFunding)) : "—", sub: peakMonth != null ? `Tháng ${peakMonth}` : undefined },
  ];

  // ─── Chi phí đất — group by category ─────────────────────────────────────

  const landByCategory = new Map<string, number>();
  for (const lc of data.landCosts) {
    const cur = landByCategory.get(lc.category) ?? 0;
    landByCategory.set(lc.category, cur + toNum(lc.totalAmount));
  }
  const totalLand = [...landByCategory.values()].reduce((s, v) => s + v, 0);

  // ─── Chi phí xây dựng — group by phase ───────────────────────────────────

  const totalConstruction = data.constructionPhases.reduce(
    (s, ph) => s + ph.packages.reduce((ps, pkg) => ps + toNum(pkg.contractValue), 0),
    0
  );

  // ─── Lãi vay + Thuế GTGT từ cashflow entries ─────────────────────────────

  const totalInterest = entries.reduce((s, e) => s + toNum(e.interestPayment), 0);
  const totalTax      = entries.reduce((s, e) => s + toNum(e.taxPayment), 0);

  // ─── Doanh thu — by ProductGroup ─────────────────────────────────────────

  // ─── Vốn vay — totals ────────────────────────────────────────────────────

  const totalLoanPrincipal    = data.loans.reduce((s, l) => s + toNum(l.principalAmount), 0);
  const totalEquityAmount     = data.equityContributions.reduce((s, e) => s + toNum(e.totalAmount), 0);
  const totalLoanDisbursed    = entries.reduce((s, e) => s + toNum(e.loanDisbursement), 0);
  const totalEquityInflow     = entries.reduce((s, e) => s + toNum(e.equityInflow), 0);

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Print-only styles: @page và break-before */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 15mm 12mm; }
          .print-break-before { break-before: page; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 4px 6px; font-size: 10pt; }
          a { color: inherit; text-decoration: none; }
        }
      `}</style>

      {/* Toolbar — ẩn khi in */}
      <div className="print:hidden mb-6 flex items-center justify-between gap-4">
        <Link
          href={`/du-an/${id}/kich-ban/${scenarioId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại kịch bản
        </Link>
        <PrintButton />
      </div>

      {/* ═══ TIÊU ĐỀ BÁO CÁO ═════════════════════════════════════════════════ */}
      <div className="mb-6 border-b-4 border-blue-700 pb-4">
        <p className="text-xs uppercase tracking-widest text-gray-400">Báo cáo tài chính dự án</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{data.project?.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>Kịch bản: <strong>{data.name}</strong></span>
          {data.isBase && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">Kịch bản gốc</span>}
          <span>Thời gian: {data.durationMonths ? `${data.durationMonths} tháng` : "—"}</span>
          {kpi && (
            <span className="text-gray-400 text-xs">
              Tính toán lúc: {new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(kpi.computedAt))}
            </span>
          )}
          <span className="ml-auto text-gray-400 text-xs print:hidden">In lúc: {printDate()}</span>
        </div>
      </div>

      {!kpi && (
        <div className="print:hidden mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Chưa có dữ liệu dòng tiền. Một số KPI sẽ hiển thị dựa trên dữ liệu nhập tay.{" "}
          <Link href={`/du-an/${id}/kich-ban/${scenarioId}/dong-tien`} className="font-medium underline">
            Tính toán dòng tiền →
          </Link>
        </div>
      )}

      {/* ═══ SECTION 1: TÓM TẮT ĐIỀU HÀNH ══════════════════════════════════ */}
      <SectionTitle>1. Tóm tắt điều hành</SectionTitle>
      <KpiGrid items={executiveSummary} />

      {/* ═══ SECTION 2: BẢNG DÒNG TIỀN TỔNG HỢP ════════════════════════════ */}
      <SectionTitle>2. Bảng dòng tiền tổng hợp</SectionTitle>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">Chưa có dữ liệu dòng tiền.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-xs">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="sticky left-0 bg-gray-100 px-3 py-2 text-center font-semibold border-r border-gray-200 w-14">T</th>
                <th className="px-2 py-2 text-right font-semibold">Thu doanh thu</th>
                <th className="px-2 py-2 text-right font-semibold">Giải ngân vay</th>
                <th className="px-2 py-2 text-right font-semibold">Góp vốn</th>
                <th className="px-2 py-2 text-right font-semibold bg-green-50">Tổng thu</th>
                <th className="px-2 py-2 text-right font-semibold">Chi đất</th>
                <th className="px-2 py-2 text-right font-semibold">Chi XD</th>
                <th className="px-2 py-2 text-right font-semibold">Trả gốc</th>
                <th className="px-2 py-2 text-right font-semibold">Trả lãi</th>
                <th className="px-2 py-2 text-right font-semibold">Thuế</th>
                <th className="px-2 py-2 text-right font-semibold bg-red-50">Tổng chi</th>
                <th className="px-2 py-2 text-right font-semibold">Ròng</th>
                <th className="px-2 py-2 text-right font-semibold">Lũy kế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => {
                const cum = toNum(e.cumulativeCashFlow);
                const isNeg = cum < 0;
                return (
                  <tr
                    key={e.id}
                    className={isNeg ? "bg-amber-50" : "hover:bg-gray-50"}
                  >
                    <td className="sticky left-0 bg-inherit px-3 py-1 text-center font-mono font-medium border-r border-gray-200">{e.projectMonth}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{toNum(e.revenueCollection) ? fVND(toNum(e.revenueCollection)) : ""}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{toNum(e.loanDisbursement) ? fVND(toNum(e.loanDisbursement)) : ""}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{toNum(e.equityInflow) ? fVND(toNum(e.equityInflow)) : ""}</td>
                    <td className="px-2 py-1 text-right tabular-nums bg-green-50 font-medium">{fVND(toNum(e.totalInflow))}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{toNum(e.landPayment) ? fVND(toNum(e.landPayment)) : ""}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{toNum(e.constructionPayment) ? fVND(toNum(e.constructionPayment)) : ""}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{toNum(e.loanRepayment) ? fVND(toNum(e.loanRepayment)) : ""}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{toNum(e.interestPayment) ? fVND(toNum(e.interestPayment)) : ""}</td>
                    <td className="px-2 py-1 text-right tabular-nums">{toNum(e.taxPayment) ? fVND(toNum(e.taxPayment)) : ""}</td>
                    <td className="px-2 py-1 text-right tabular-nums bg-red-50 font-medium">{fVND(toNum(e.totalOutflow))}</td>
                    <td className={`px-2 py-1 text-right tabular-nums font-medium ${toNum(e.netCashFlow) >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {fVND(toNum(e.netCashFlow))}
                    </td>
                    <td className={`px-2 py-1 text-right tabular-nums font-semibold ${cum >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {fVND(cum)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {entries.length > 0 && (
              <tfoot className="bg-gray-800 text-white text-xs font-semibold">
                <tr>
                  <td className="sticky left-0 bg-gray-800 px-3 py-2 text-center border-r border-gray-600">TỔNG</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fVND(entries.reduce((s, e) => s + toNum(e.revenueCollection), 0))}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fVND(totalLoanDisbursed)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fVND(totalEquityInflow)}</td>
                  <td className="px-2 py-2 text-right tabular-nums bg-green-900">{fVND(entries.reduce((s, e) => s + toNum(e.totalInflow), 0))}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fVND(entries.reduce((s, e) => s + toNum(e.landPayment), 0))}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fVND(entries.reduce((s, e) => s + toNum(e.constructionPayment), 0))}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fVND(entries.reduce((s, e) => s + toNum(e.loanRepayment), 0))}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fVND(totalInterest)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{fVND(totalTax)}</td>
                  <td className="px-2 py-2 text-right tabular-nums bg-red-900">{fVND(entries.reduce((s, e) => s + toNum(e.totalOutflow), 0))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* ═══ SECTION 3: CHI TIẾT CHI PHÍ ════════════════════════════════════ */}
      <SectionTitle>3. Chi tiết chi phí</SectionTitle>

      {/* Chi phí đất */}
      <h3 className="mb-2 text-sm font-semibold text-gray-700">3.1 Chi phí đất</h3>
      {data.landCosts.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400">Chưa có dữ liệu.</p>
      ) : (
        <table className="mb-6 min-w-full border border-gray-200 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Danh mục</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Thành tiền (₫)</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...landByCategory.entries()].map(([cat, amt]) => (
              <tr key={cat} className="hover:bg-gray-50">
                <td className="px-3 py-1.5">{LAND_COST_CATEGORY_LABELS[cat as keyof typeof LAND_COST_CATEGORY_LABELS] ?? cat}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fVND(amt)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums text-gray-500">
                  {totalLand > 0 ? fPct(amt / totalLand) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-3 py-1.5">Tổng chi phí đất</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalLand)}</td>
              <td className="px-3 py-1.5 text-right">100%</td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Chi phí xây dựng */}
      <h3 className="mb-2 text-sm font-semibold text-gray-700">3.2 Chi phí xây dựng</h3>
      {data.constructionPhases.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400">Chưa có dữ liệu.</p>
      ) : (
        <table className="mb-6 min-w-full border border-gray-200 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Giai đoạn / Gói thầu</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">T.bắt đầu</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">T.kết thúc</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Giá trị hợp đồng (₫)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.constructionPhases.map((ph) => {
              const phTotal = ph.packages.reduce((s, p) => s + toNum(p.contractValue), 0);
              return (
                <Fragment key={ph.id}>
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-3 py-1.5" colSpan={3}>{ph.name}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{fVND(phTotal)}</td>
                  </tr>
                  {ph.packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 pl-8 text-gray-600">└ {pkg.name}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500">{pkg.startMonth}</td>
                      <td className="px-3 py-1.5 text-right text-gray-500">{pkg.endMonth}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{fVND(toNum(pkg.contractValue))}</td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-3 py-1.5" colSpan={3}>Tổng chi phí xây dựng</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalConstruction)}</td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Lãi vay + Thuế GTGT */}
      <h3 className="mb-2 text-sm font-semibold text-gray-700">3.3 Lãi vay & Thuế GTGT</h3>
      <table className="mb-6 min-w-[400px] border border-gray-200 text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-gray-700">Khoản mục</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-700">Tổng (₫)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="px-3 py-1.5">Lãi vay</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalInterest)}</td>
          </tr>
          <tr>
            <td className="px-3 py-1.5">Thuế GTGT</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalTax)}</td>
          </tr>
        </tbody>
        <tfoot className="bg-gray-50 font-semibold">
          <tr>
            <td className="px-3 py-1.5">Tổng</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalInterest + totalTax)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Tổng hợp chi phí */}
      <h3 className="mb-2 text-sm font-semibold text-gray-700">3.4 Tổng hợp chi phí</h3>
      <table className="mb-4 min-w-[500px] border border-gray-200 text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-gray-700">Nhóm chi phí</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-700">Giá trị (₫)</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-700">Tỷ lệ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[
            { label: "Chi phí đất", value: totalLand },
            { label: "Chi phí xây dựng", value: totalConstruction },
            { label: "Lãi vay", value: totalInterest },
            { label: "Thuế GTGT", value: totalTax },
          ].map((row) => (
            <tr key={row.label} className="hover:bg-gray-50">
              <td className="px-3 py-1.5">{row.label}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{fVND(row.value)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums text-gray-500">
                {totalCost > 0 ? fPct(row.value / totalCost) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-800 text-white font-semibold">
          <tr>
            <td className="px-3 py-1.5">Tổng chi phí dự án</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalCost)}</td>
            <td className="px-3 py-1.5 text-right">100%</td>
          </tr>
        </tfoot>
      </table>

      {/* ═══ SECTION 4: CHI TIẾT DOANH THU ══════════════════════════════════ */}
      <div className="print-break-before">
        <SectionTitle>4. Chi tiết doanh thu</SectionTitle>
        {data.productGroups.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có dữ liệu.</p>
        ) : (
          <table className="mb-4 min-w-full border border-gray-200 text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Nhóm sản phẩm</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Loại</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Tổng SP</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Diện tích (m²)</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Giá gốc</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">VAT</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Số đợt bán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.productGroups.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-3 py-1.5 font-medium">{g.name}</td>
                  <td className="px-3 py-1.5 text-gray-600">
                    {REVENUE_PRODUCT_TYPE_LABELS[g.productType as keyof typeof REVENUE_PRODUCT_TYPE_LABELS] ?? g.productType}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{g.totalUnits.toLocaleString("vi-VN")}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{g.area ? g.area.toLocaleString("vi-VN") : "—"}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fVND(toNum(g.basePrice))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{fPct(toNum(g.vatRate))}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{g.batches.length}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-3 py-1.5">Tổng</td>
                <td />
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {data.productGroups.reduce((s, g) => s + g.totalUnits, 0).toLocaleString("vi-VN")}
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* ═══ SECTION 5: VỐN VÀ TÀI TRỢ ══════════════════════════════════════ */}
      <SectionTitle>5. Vốn và tài trợ</SectionTitle>

      {/* Vay */}
      <h3 className="mb-2 text-sm font-semibold text-gray-700">5.1 Khoản vay</h3>
      {data.loans.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400">Chưa có khoản vay.</p>
      ) : (
        <table className="mb-6 min-w-full border border-gray-200 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Tên khoản vay</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Loại</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Dư nợ gốc (₫)</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Lãi suất/năm</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Kỳ hạn (th.)</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Phương thức trả</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Bắt đầu th.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.loans.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-3 py-1.5 font-medium">{l.name}</td>
                <td className="px-3 py-1.5 text-gray-600">
                  {LOAN_TYPE_LABELS[l.type as keyof typeof LOAN_TYPE_LABELS] ?? l.type}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fVND(toNum(l.principalAmount))}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fPct(toNum(l.interestRate))}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{l.tenorMonths}</td>
                <td className="px-3 py-1.5 text-gray-600">
                  {REPAYMENT_METHOD_LABELS[l.repaymentMethod as keyof typeof REPAYMENT_METHOD_LABELS] ?? l.repaymentMethod}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">{l.startMonth}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-3 py-1.5">Tổng</td>
              <td />
              <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalLoanPrincipal)}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      )}

      {/* Góp vốn */}
      <h3 className="mb-2 text-sm font-semibold text-gray-700">5.2 Góp vốn</h3>
      {data.equityContributions.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400">Chưa có đợt góp vốn.</p>
      ) : (
        <table className="mb-6 min-w-full border border-gray-200 text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Tên đợt góp vốn</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Loại nguồn</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700">Bên góp vốn</th>
              <th className="px-3 py-2 text-right font-semibold text-gray-700">Tổng số tiền (₫)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.equityContributions.map((eq) => (
              <tr key={eq.id} className="hover:bg-gray-50">
                <td className="px-3 py-1.5 font-medium">{eq.name}</td>
                <td className="px-3 py-1.5 text-gray-600">
                  {EQUITY_SOURCE_TYPE_LABELS[eq.sourceType as keyof typeof EQUITY_SOURCE_TYPE_LABELS] ?? eq.sourceType}
                </td>
                <td className="px-3 py-1.5 text-gray-600">{eq.contributorName ?? "—"}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{fVND(toNum(eq.totalAmount))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-3 py-1.5" colSpan={3}>Tổng</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalEquityAmount)}</td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* Tóm tắt cơ cấu vốn */}
      <h3 className="mb-2 text-sm font-semibold text-gray-700">5.3 Tóm tắt cơ cấu vốn</h3>
      <table className="mb-8 min-w-[500px] border border-gray-200 text-xs">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-gray-700">Nguồn vốn</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-700">Kế hoạch (₫)</th>
            <th className="px-3 py-2 text-right font-semibold text-gray-700">Thực giải ngân (₫)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr className="hover:bg-gray-50">
            <td className="px-3 py-1.5">Vay</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalLoanPrincipal)}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalLoanDisbursed)}</td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-3 py-1.5">Góp vốn</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalEquityAmount)}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalEquityInflow)}</td>
          </tr>
        </tbody>
        <tfoot className="bg-gray-50 font-semibold">
          <tr>
            <td className="px-3 py-1.5">Tổng</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalLoanPrincipal + totalEquityAmount)}</td>
            <td className="px-3 py-1.5 text-right tabular-nums">{fVND(totalLoanDisbursed + totalEquityInflow)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <div className="mt-8 border-t border-gray-200 pt-4 text-center text-xs text-gray-400 print:hidden">
        <p>FS Dòng Tiền BĐS — Báo cáo tài chính dự án</p>
      </div>
    </div>
  );
}
