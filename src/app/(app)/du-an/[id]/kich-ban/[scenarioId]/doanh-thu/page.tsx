import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Plus, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { listGroupsByScenario } from "@/lib/db/product-groups";
import {
  REVENUE_PRODUCT_TYPE_LABELS,
  PRICE_UNIT_LABELS,
} from "@/lib/validations/product-group";
import type { RevenueProductType, PriceUnit } from "@/generated/prisma/client";
import { computeBatchUnitPrice, computeAbsorptionMonths } from "@/lib/finance/revenue";
import type { CollectionInstallment } from "@/lib/validations/product-batch";
import DeleteProductGroupButton from "@/components/revenue/DeleteProductGroupButton";
import DeleteProductBatchButton from "@/components/revenue/DeleteProductBatchButton";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Doanh thu | FS Dòng Tiền BĐS",
};

type DecimalLike = { toString(): string };

function toNum(d: DecimalLike | null | undefined): number {
  return d != null ? parseFloat(d.toString()) : 0;
}

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

function formatRate(r: number): string {
  const pct = r * 100;
  return pct === 0 ? "0%" : `${pct > 0 ? "+" : ""}${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

export default async function DoanhThuPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, groups] = await Promise.all([
    getScenarioById(scenarioId),
    listGroupsByScenario(scenarioId),
  ]);
  if (!scenario || scenario.projectId !== projectId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const baseHref = `/du-an/${projectId}/kich-ban/${scenarioId}/doanh-thu`;

  // Tổng doanh thu chưa VAT
  let grandTotalExVat = 0;
  let grandVat = 0;

  const groupSummaries = groups.map((group) => {
    const bp = toNum(group.basePrice);
    const vatR = toNum(group.vatRate);
    const priceUnit = group.priceUnit as PriceUnit;
    const area = group.area;

    const batchRevenues = group.batches.map((batch) => {
      const adj = toNum(batch.priceAdjustmentRate);
      const unitPrice = computeBatchUnitPrice({ priceUnit, area, basePrice: bp }, adj);
      const revenue = unitPrice * batch.unitsOffered;
      const absMonths = computeAbsorptionMonths(batch.unitsOffered, toNum(batch.salesVelocity));
      const lastMonth = batch.launchMonth + absMonths - 1;
      const schedule = batch.collectionSchedule as unknown as CollectionInstallment[];
      return { batch, unitPrice, revenue, absMonths, lastMonth, schedule };
    });

    const groupRevExVat = batchRevenues.reduce((s, b) => s + b.revenue, 0);
    const groupVat = groupRevExVat * vatR;
    grandTotalExVat += groupRevExVat;
    grandVat += groupVat;

    const usedUnits = group.batches.reduce((s, b) => s + b.unitsOffered, 0);

    return { group, batchRevenues, groupRevExVat, groupVat, usedUnits };
  });

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
            <h1 className="text-2xl font-semibold text-gray-900">Doanh thu</h1>
            <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
          </div>
          <Link
            href={`${baseHref}/tao-nhom`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm nhóm sản phẩm
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm font-medium text-gray-700">Chưa có nhóm sản phẩm</p>
          <p className="mt-1 text-sm text-gray-400">
            Thêm nhóm sản phẩm để lập kế hoạch doanh thu theo từng loại hàng hóa.
          </p>
          <Link
            href={`${baseHref}/tao-nhom`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm nhóm sản phẩm
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {groupSummaries.map(({ group, batchRevenues, groupRevExVat, groupVat, usedUnits }) => {
            const bp = toNum(group.basePrice);
            const priceUnit = group.priceUnit as PriceUnit;
            const area = group.area;
            const baseUnitPrice = priceUnit === "PER_SQM" && area ? bp * area : bp;

            return (
              <div
                key={group.id}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden"
              >
                {/* Header nhóm */}
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-900">{group.name}</h2>
                      {group.productCode && (
                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                          {group.productCode}
                        </span>
                      )}
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {REVENUE_PRODUCT_TYPE_LABELS[group.productType as RevenueProductType]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {group.totalUnits} {priceUnit === "PER_SQM" ? `căn · ${group.area}m² · ${PRICE_UNIT_LABELS[priceUnit]}` : `căn · ${PRICE_UNIT_LABELS[priceUnit]}`}
                      {" · "}Giá gốc: {formatVND(baseUnitPrice)}/căn
                      {" · "}VAT: {(toNum(group.vatRate) * 100).toFixed(0)}%
                      {usedUnits < group.totalUnits && (
                        <span className="ml-2 text-amber-600">
                          ({group.totalUnits - usedUnits} căn chưa có đợt)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatVND(groupRevExVat)}</p>
                      <p className="text-xs text-gray-400">chưa VAT</p>
                    </div>
                    <Link
                      href={`${baseHref}/${group.id}/dot-ban/tao-moi`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Đợt mở bán
                    </Link>
                    <Link
                      href={`${baseHref}/${group.id}/sua`}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Sửa
                    </Link>
                    <DeleteProductGroupButton
                      groupId={group.id}
                      scenarioId={scenarioId}
                      projectId={projectId}
                      groupName={group.name}
                    />
                  </div>
                </div>

                {/* Đợt mở bán */}
                {group.batches.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-400">
                    Chưa có đợt mở bán.{" "}
                    <Link
                      href={`${baseHref}/${group.id}/dot-ban/tao-moi`}
                      className="text-blue-600 hover:underline"
                    >
                      Thêm đợt mở bán
                    </Link>
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {batchRevenues.map(({ batch, unitPrice, revenue, absMonths, lastMonth, schedule }) => {
                      const adj = toNum(batch.priceAdjustmentRate);
                      return (
                        <div key={batch.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{batch.name}</p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                Tháng {batch.launchMonth} · {batch.unitsOffered} căn ·{" "}
                                {toNum(batch.salesVelocity)} căn/tháng · Bán hết T{lastMonth}
                              </p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                Giá: {formatVND(unitPrice)}/căn{" "}
                                {adj !== 0 && (
                                  <span className={adj > 0 ? "text-green-600" : "text-red-500"}>
                                    ({formatRate(adj)})
                                  </span>
                                )}
                                {" · "}
                                {schedule.length} đợt thu (
                                {schedule.map((s, i) => (
                                  <span key={i}>
                                    {s.percent}%{i < schedule.length - 1 ? "/" : ""}
                                  </span>
                                ))}
                                )
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800">
                                {formatVND(revenue)}
                              </span>
                              <Link
                                href={`${baseHref}/${group.id}/dot-ban/${batch.id}/sua`}
                                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                                Sửa
                              </Link>
                              <DeleteProductBatchButton
                                batchId={batch.id}
                                scenarioId={scenarioId}
                                projectId={projectId}
                                batchName={batch.name}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tổng nhóm */}
                {group.batches.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-600">
                      Tổng nhóm ({group.batches.length} đợt · {usedUnits} căn)
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{formatVND(groupRevExVat)}</span>
                      <span className="ml-2 text-xs text-gray-400">+ VAT {formatVND(groupVat)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Tổng toàn bộ */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 space-y-2">
            <h3 className="text-sm font-semibold text-blue-700">Tổng doanh thu</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-blue-500">Chưa VAT</p>
                <p className="mt-0.5 text-base font-bold text-blue-900">{formatVND(grandTotalExVat)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-500">VAT phải nộp</p>
                <p className="mt-0.5 text-base font-bold text-blue-900">{formatVND(grandVat)}</p>
              </div>
              <div>
                <p className="text-xs text-blue-500">Bao gồm VAT</p>
                <p className="mt-0.5 text-base font-bold text-blue-900">{formatVND(grandTotalExVat + grandVat)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
