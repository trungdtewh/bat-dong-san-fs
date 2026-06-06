import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Plus, Pencil } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { listPhasesByScenario } from "@/lib/db/construction-phases";
import { getRequiredSession } from "@/lib/auth/session";
import { assertProjectAccess } from "@/lib/db/access";
import { DISTRIBUTION_TYPE_LABELS } from "@/lib/validations/contract-package";
import { CONSTRUCTION_COST_CATEGORY_LABELS } from "@/lib/validations/construction-cost";
import type { DistributionType, ConstructionCostCategory } from "@/generated/prisma/client";
import DeletePhaseButton from "@/components/construction/DeletePhaseButton";
import DeletePackageButton from "@/components/construction/DeletePackageButton";
import DeleteCostButton from "@/components/construction/DeleteCostButton";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Chi phí xây dựng | FS Dòng Tiền BĐS",
};

type DecimalLike = { toString(): string };

function formatVND(d: DecimalLike): string {
  const n = parseFloat(d.toString());
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

function sumDecimals(items: { totalAmount: DecimalLike }[]): number {
  return items.reduce((s, i) => s + parseFloat(i.totalAmount.toString()), 0);
}

export default async function ChiPhiXayDungPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;
  const session = await getRequiredSession().catch(() => null);
  if (!session) redirect("/dang-nhap");

  const [scenario, phases] = await Promise.all([
    getScenarioById(scenarioId),
    listPhasesByScenario(scenarioId),
  ]);

  if (!scenario || scenario.projectId !== projectId) notFound();
  await assertProjectAccess(session.user.id, projectId).catch(() => notFound());

  const baseHref = `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-xay-dung`;

  const grandTotal = phases.reduce((sum, phase) => {
    const pkgTotal = phase.packages.reduce(
      (s, pkg) => s + parseFloat(pkg.contractValue.toString()),
      0
    );
    const directTotal = phase.constructionCosts.reduce(
      (s, c) => s + parseFloat(c.totalAmount.toString()),
      0
    );
    return sum + pkgTotal + directTotal;
  }, 0);

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
            <h1 className="text-2xl font-semibold text-gray-900">Chi phí xây dựng</h1>
            <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
          </div>
          <Link
            href={`${baseHref}/tao-giai-doan`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm giai đoạn
          </Link>
        </div>
      </div>

      {phases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm font-medium text-gray-700">Chưa có giai đoạn thi công</p>
          <p className="mt-1 text-sm text-gray-400">
            Thêm giai đoạn để tổ chức chi phí xây dựng theo từng giai đoạn của dự án.
          </p>
          <Link
            href={`${baseHref}/tao-giai-doan`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm giai đoạn thi công
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {phases.map((phase) => {
            const pkgTotal = phase.packages.reduce(
              (s, pkg) => s + parseFloat(pkg.contractValue.toString()),
              0
            );
            const directTotal = sumDecimals(phase.constructionCosts);
            const phaseTotal = pkgTotal + directTotal;

            return (
              <div
                key={phase.id}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden"
              >
                {/* Header giai đoạn */}
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gray-50 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{phase.name}</h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Tháng {phase.startMonth} → {phase.endMonth}
                      {phase.description ? ` · ${phase.description}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat("vi-VN").format(phaseTotal)} ₫
                    </span>
                    <Link
                      href={`${baseHref}/${phase.id}/goi-thau/tao-moi`}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Gói thầu
                    </Link>
                    <Link
                      href={`${baseHref}/${phase.id}/sua`}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Sửa
                    </Link>
                    <DeletePhaseButton
                      phaseId={phase.id}
                      scenarioId={scenarioId}
                      projectId={projectId}
                      phaseName={phase.name}
                    />
                  </div>
                </div>

                {/* Gói thầu */}
                {phase.packages.length === 0 && phase.constructionCosts.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-400">
                    Chưa có gói thầu.{" "}
                    <Link
                      href={`${baseHref}/${phase.id}/goi-thau/tao-moi`}
                      className="text-blue-600 hover:underline"
                    >
                      Thêm gói thầu
                    </Link>
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {phase.packages.map((pkg) => {
                      const costTotal = sumDecimals(pkg.constructionCosts);
                      return (
                        <div key={pkg.id} className="px-5 py-4">
                          {/* Header gói thầu */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{pkg.name}</p>
                              <p className="mt-0.5 text-xs text-gray-500">
                                {pkg.contractorName ? `${pkg.contractorName} · ` : ""}
                                T{pkg.startMonth}→T{pkg.endMonth} ·{" "}
                                {DISTRIBUTION_TYPE_LABELS[pkg.distributionType as DistributionType]}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800">
                                {formatVND(pkg.contractValue)}
                              </span>
                              <Link
                                href={`${baseHref}/${phase.id}/goi-thau/${pkg.id}/hang-muc/tao-moi`}
                                className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                                Hạng mục
                              </Link>
                              <Link
                                href={`${baseHref}/${phase.id}/goi-thau/${pkg.id}/sua`}
                                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Pencil className="h-3 w-3" />
                                Sửa
                              </Link>
                              <DeletePackageButton
                                packageId={pkg.id}
                                phaseId={phase.id}
                                scenarioId={scenarioId}
                                projectId={projectId}
                                packageName={pkg.name}
                              />
                            </div>
                          </div>

                          {/* Hạng mục trong gói thầu */}
                          {pkg.constructionCosts.length > 0 && (
                            <div className="mt-3 overflow-hidden rounded-lg border border-gray-100">
                              <table className="min-w-full divide-y divide-gray-100 text-xs">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Loại</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Tên hạng mục</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Khối lượng</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Đơn giá</th>
                                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Thành tiền</th>
                                    <th className="px-3 py-2" />
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 bg-white">
                                  {pkg.constructionCosts.map((cost) => (
                                    <tr key={cost.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-gray-500">
                                        {CONSTRUCTION_COST_CATEGORY_LABELS[cost.category as ConstructionCostCategory] ?? cost.category}
                                      </td>
                                      <td className="px-3 py-2 text-gray-900">{cost.name}</td>
                                      <td className="px-3 py-2 text-right text-gray-500">
                                        {cost.quantity != null
                                          ? `${new Intl.NumberFormat("vi-VN").format(cost.quantity)}${cost.unit ? ` ${cost.unit}` : ""}`
                                          : "—"}
                                      </td>
                                      <td className="px-3 py-2 text-right text-gray-500">
                                        {cost.unitPrice ? formatVND(cost.unitPrice) : "—"}
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                                        {formatVND(cost.totalAmount)}
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center justify-end gap-1">
                                          <Link
                                            href={`${baseHref}/${phase.id}/goi-thau/${pkg.id}/hang-muc/${cost.id}/sua`}
                                            className="rounded px-1.5 py-0.5 text-blue-600 hover:bg-blue-50"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </Link>
                                          <DeleteCostButton
                                            costId={cost.id}
                                            phaseId={phase.id}
                                            scenarioId={scenarioId}
                                            projectId={projectId}
                                            costName={cost.name}
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                  <tr>
                                    <td colSpan={4} className="px-3 py-2 text-xs font-semibold text-gray-600">
                                      Tổng hạng mục
                                    </td>
                                    <td className="px-3 py-2 text-right text-xs font-bold text-gray-900">
                                      {new Intl.NumberFormat("vi-VN").format(costTotal)} ₫
                                    </td>
                                    <td />
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tổng giai đoạn */}
                {(phase.packages.length > 0 || phase.constructionCosts.length > 0) && (
                  <div className="border-t border-gray-200 bg-gray-50 px-5 py-3 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-600">
                      Tổng giai đoạn ({phase.packages.length} gói thầu)
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {new Intl.NumberFormat("vi-VN").format(phaseTotal)} ₫
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Tổng toàn bộ */}
          {phases.length > 1 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 flex justify-between items-center">
              <span className="text-sm font-semibold text-blue-700">
                Tổng chi phí xây dựng ({phases.length} giai đoạn)
              </span>
              <span className="text-lg font-bold text-blue-900">
                {new Intl.NumberFormat("vi-VN").format(grandTotal)} ₫
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
