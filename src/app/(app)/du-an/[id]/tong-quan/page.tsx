import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Star, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import { getProjectWithKPIs } from "@/lib/db/projects";
import { PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS } from "@/lib/validations/project";
import { SCENARIO_TYPE_LABELS } from "@/lib/validations/scenario";
import ScenarioTypeBadge from "@/components/scenarios/ScenarioTypeBadge";
import ProjectStatusBadge from "@/components/projects/ProjectStatusBadge";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectWithKPIs(id);
  return {
    title: project
      ? `Dashboard — ${project.name} | FS Dòng Tiền BĐS`
      : "Dashboard | FS Dòng Tiền BĐS",
  };
}

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────

type DecimalLike = { toString(): string };

function n(d: DecimalLike | null | undefined): number {
  return d != null ? parseFloat(d.toString()) : 0;
}

function fmtVND(val: number): string {
  if (val === 0) return "—";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e9) {
    return (
      sign +
      (abs / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) +
      " tỷ"
    );
  }
  if (abs >= 1e6) {
    return (
      sign +
      (abs / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) +
      " tr"
    );
  }
  return sign + Math.round(abs).toLocaleString("vi-VN") + " ₫";
}

function fmtVNDFull(val: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(val)) + " ₫";
}

function fmtPct(val: number, decimals = 1): string {
  return (
    (val * 100).toLocaleString("vi-VN", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) + "%"
  );
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function fmtArea(v: number | null | undefined): string {
  if (v == null || v === 0) return "—";
  return v.toLocaleString("vi-VN") + " m²";
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color = "default",
  size = "normal",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  color?: "default" | "green" | "red" | "blue" | "orange" | "purple";
  size?: "normal" | "large";
}) {
  const textColor: Record<string, string> = {
    default: "text-gray-900",
    green: "text-emerald-700",
    red: "text-red-600",
    blue: "text-blue-700",
    orange: "text-orange-600",
    purple: "text-purple-700",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p
        className={`mt-1 font-semibold ${size === "large" ? "text-xl" : "text-lg"} ${textColor[color]}`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default async function TongQuanPage({ params }: Props) {
  const { id } = await params;
  const project = await getProjectWithKPIs(id);
  if (!project) notFound();

  const { scenarios } = project;

  // Kịch bản cơ sở: isBase=true, fallback sang đầu tiên
  const baseScenario =
    scenarios.find((s) => s.isBase) ?? scenarios[0] ?? null;
  const baseKPI = baseScenario?.kpiSnapshot ?? null;

  const totalScenarios = scenarios.length;
  const computedCount = scenarios.filter((s) => s.kpiSnapshot != null).length;

  return (
    <div className="space-y-6">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div>
        <Link
          href={`/du-an/${id}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại chi tiết dự án
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {project.name}
              </h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {PROJECT_TYPE_LABELS[project.type] ?? project.type}
              </span>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {[project.province, project.district]
                .filter(Boolean)
                .join(" · ")}
              {project.description && ` · ${project.description}`}
            </p>
          </div>

          {/* Trạng thái tính toán */}
          <div className="shrink-0 text-right">
            <p className="text-xs text-gray-500">
              {computedCount}/{totalScenarios} kịch bản đã tính dòng tiền
            </p>
            {baseKPI && (
              <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Cập nhật {fmtDate(baseKPI.computedAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION A: KPI kịch bản cơ sở ─────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">
              Chỉ tiêu tài chính — Kịch bản cơ sở
            </h2>
            {baseScenario && (
              <p className="mt-0.5 text-xs text-gray-500">
                {baseScenario.name}
                {baseScenario.isBase && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-600">
                    <Star className="h-3 w-3 fill-amber-500" />
                    Kịch bản cơ sở
                  </span>
                )}
              </p>
            )}
          </div>
          {baseScenario && (
            <Link
              href={`/du-an/${id}/kich-ban/${baseScenario.id}/dong-tien`}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Xem dòng tiền →
            </Link>
          )}
        </div>

        {!baseScenario ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Chưa có kịch bản nào.{" "}
            <Link
              href={`/du-an/${id}/kich-ban`}
              className="text-blue-600 hover:underline"
            >
              Tạo kịch bản đầu tiên →
            </Link>
          </div>
        ) : !baseKPI ? (
          <div className="px-5 py-6">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Kịch bản cơ sở chưa có dữ liệu dòng tiền
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Vào trang{" "}
                  <Link
                    href={`/du-an/${id}/kich-ban/${baseScenario.id}/dong-tien`}
                    className="font-medium underline hover:no-underline"
                  >
                    Dòng tiền của kịch bản này
                  </Link>{" "}
                  và nhấn &quot;Tính toán lại&quot; để tổng hợp các chỉ tiêu.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            {/* Hàng 1 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="Tổng doanh thu"
                value={fmtVNDFull(n(baseKPI.totalRevenue))}
                color="blue"
                size="large"
              />
              <KpiCard
                label="Lợi nhuận gộp"
                value={fmtVNDFull(n(baseKPI.grossProfit))}
                sub={`Biên: ${fmtPct(n(baseKPI.grossMargin))}`}
                color={n(baseKPI.grossProfit) >= 0 ? "green" : "red"}
                size="large"
              />
              <KpiCard
                label="IRR dự án"
                value={
                  baseKPI.irr != null ? fmtPct(n(baseKPI.irr)) : "N/A"
                }
                sub="Unlevered · năm"
                color={
                  baseKPI.irr != null && n(baseKPI.irr) > 0
                    ? "green"
                    : "default"
                }
                size="large"
              />
              <KpiCard
                label="ROI"
                value={fmtPct(n(baseKPI.roi))}
                sub="Lợi nhuận / Chi phí"
                color={n(baseKPI.roi) >= 0 ? "green" : "red"}
                size="large"
              />
            </div>
            {/* Hàng 2 */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="NPV"
                value={fmtVND(n(baseKPI.npv))}
                sub={
                  baseScenario.discountRate
                    ? `Chiết khấu ${fmtPct(n(baseScenario.discountRate))}/năm`
                    : "Chiết khấu mặc định 12%/năm"
                }
                color={n(baseKPI.npv) >= 0 ? "green" : "red"}
              />
              <KpiCard
                label="Thời gian hoàn vốn"
                value={
                  baseKPI.paybackPeriodMonths != null
                    ? `Tháng ${baseKPI.paybackPeriodMonths}`
                    : "Chưa hoàn vốn"
                }
                sub="Dòng tiền lũy kế ≥ 0"
                color={
                  baseKPI.paybackPeriodMonths != null ? "green" : "orange"
                }
              />
              <KpiCard
                label="Biên lợi nhuận"
                value={fmtPct(n(baseKPI.netMargin))}
                sub="Lợi nhuận / Doanh thu"
                color={n(baseKPI.netMargin) >= 0 ? "green" : "red"}
              />
              <KpiCard
                label="Đỉnh thiếu hụt vốn"
                value={
                  baseKPI.peakFundingMonth != null
                    ? fmtVND(n(baseKPI.peakFundingRequirement))
                    : "—"
                }
                sub={
                  baseKPI.peakFundingMonth != null
                    ? `Tháng ${baseKPI.peakFundingMonth}`
                    : "Không có"
                }
                color={
                  n(baseKPI.peakFundingRequirement) < 0 ? "orange" : "default"
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION B: So sánh các kịch bản ──────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700">
            So sánh các kịch bản ({totalScenarios})
          </h2>
        </div>

        {scenarios.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            Chưa có kịch bản nào.{" "}
            <Link
              href={`/du-an/${id}/kich-ban`}
              className="text-blue-600 hover:underline"
            >
              Tạo kịch bản →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Kịch bản
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-500">
                    Loại
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-500">
                    Doanh thu
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-500">
                    Chi phí
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-500">
                    Lợi nhuận
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-500">
                    Biên LN
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-500">
                    IRR
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-500">
                    ROI
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold text-gray-500">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {scenarios.map((s) => {
                  const kpi = s.kpiSnapshot;
                  const isBase = s.isBase;
                  const hasKPI = kpi != null;

                  return (
                    <tr
                      key={s.id}
                      className={
                        isBase
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-gray-50"
                      }
                    >
                      {/* Tên kịch bản */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isBase && (
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                          )}
                          <span className="font-medium text-gray-900">
                            {s.name}
                          </span>
                        </div>
                      </td>
                      {/* Loại */}
                      <td className="px-4 py-3">
                        <ScenarioTypeBadge type={s.type} />
                      </td>
                      {/* KPI cols */}
                      <KpiCell
                        val={hasKPI ? n(kpi!.totalRevenue) : null}
                        fmt={fmtVND}
                        color="blue"
                      />
                      <KpiCell
                        val={hasKPI ? n(kpi!.totalCost) : null}
                        fmt={fmtVND}
                      />
                      <KpiCell
                        val={hasKPI ? n(kpi!.grossProfit) : null}
                        fmt={fmtVND}
                        signed
                      />
                      <KpiCell
                        val={hasKPI ? n(kpi!.grossMargin) : null}
                        fmt={(v) => fmtPct(v)}
                        signed
                      />
                      <KpiCell
                        val={hasKPI && kpi!.irr != null ? n(kpi!.irr) : null}
                        fmt={(v) => fmtPct(v)}
                        signed
                        naText={hasKPI ? "N/A" : "—"}
                      />
                      <KpiCell
                        val={hasKPI ? n(kpi!.roi) : null}
                        fmt={(v) => fmtPct(v)}
                        signed
                      />
                      {/* Trạng thái */}
                      <td className="px-4 py-3 text-center">
                        {hasKPI ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Đã tính
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                            <Clock className="h-3 w-3" />
                            Chưa tính
                          </span>
                        )}
                      </td>
                      {/* Hành động */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/du-an/${id}/kich-ban/${s.id}/dong-tien`}
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            {hasKPI ? "Dòng tiền →" : "Tính toán →"}
                          </Link>
                          <Link
                            href={`/du-an/${id}/kich-ban/${s.id}`}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            Chi tiết
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION C: Thông tin dự án ────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700">
            Thông tin dự án
          </h2>
          <Link
            href={`/du-an/${id}/sua`}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Chỉnh sửa →
          </Link>
        </div>
        <div className="p-5">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            <InfoRow label="Mã dự án" value={project.code} />
            <InfoRow
              label="Loại hình"
              value={PROJECT_TYPE_LABELS[project.type] ?? project.type}
            />
            <InfoRow
              label="Trạng thái"
              value={
                <ProjectStatusBadge status={project.status} />
              }
            />
            <InfoRow label="Tỉnh / Thành phố" value={project.province} />
            <InfoRow
              label="Quận / Huyện"
              value={project.district ?? "—"}
            />
            <InfoRow
              label="Địa chỉ"
              value={project.address ?? "—"}
            />
            <InfoRow
              label="Diện tích đất"
              value={fmtArea(project.totalArea)}
            />
            <InfoRow
              label="Diện tích xây dựng"
              value={fmtArea(project.buildableArea)}
            />
            <InfoRow
              label="Tổng diện tích sàn"
              value={fmtArea(project.grossFloorArea)}
            />
            <InfoRow
              label="Diện tích thương mại"
              value={fmtArea(project.commercialArea)}
            />
            <InfoRow
              label="Ngày khởi công (dự kiến)"
              value={
                project.startDate
                  ? new Intl.DateTimeFormat("vi-VN").format(project.startDate)
                  : "—"
              }
            />
            <InfoRow
              label="Ngày hoàn thành (dự kiến)"
              value={
                project.endDate
                  ? new Intl.DateTimeFormat("vi-VN").format(project.endDate)
                  : "—"
              }
            />
          </dl>
          {project.description && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500">Mô tả</p>
              <p className="mt-1 text-sm text-gray-700">{project.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KPI TABLE CELL ───────────────────────────────────────────────────────────

function KpiCell({
  val,
  fmt,
  color,
  signed,
  naText = "—",
}: {
  val: number | null;
  fmt: (v: number) => string;
  color?: "blue";
  signed?: boolean;
  naText?: string;
}) {
  if (val === null) {
    return (
      <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-300">
        {naText}
      </td>
    );
  }
  let cls = "whitespace-nowrap px-4 py-3 text-right text-sm ";
  if (color === "blue") {
    cls += "font-medium text-blue-700";
  } else if (signed) {
    cls += val >= 0 ? "text-emerald-700" : "text-red-600";
  } else {
    cls += "text-gray-700";
  }
  return <td className={cls}>{fmt(val)}</td>;
}
