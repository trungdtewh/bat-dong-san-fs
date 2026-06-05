import Link from "next/link";
import { Pencil } from "lucide-react";
import DeleteLandCostButton from "./DeleteLandCostButton";
import {
  LAND_COST_CATEGORY_LABELS,
  AREA_BASED_CATEGORIES,
  type LandCostCategoryKey,
} from "@/lib/validations/land-cost";
import type { LandCostCategory } from "@/generated/prisma/client";

type LandCostRow = {
  id: string;
  category: LandCostCategory;
  name: string;
  area: number | null;
  unitPrice: { toString(): string } | null;
  totalAmount: { toString(): string };
  paymentMonth: number;
};

interface Props {
  costs: LandCostRow[];
  projectId: string;
  scenarioId: string;
}

function formatVND(d: { toString(): string }): string {
  const n = parseFloat(d.toString());
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

function formatArea(n: number | null): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("vi-VN").format(n) + " m²";
}

function formatUnitPrice(d: { toString(): string } | null): string {
  if (d == null) return "—";
  const n = parseFloat(d.toString());
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫/m²";
}

const CATEGORY_BADGE: Record<LandCostCategoryKey, string> = {
  LAND_USE_FEE: "bg-blue-100 text-blue-800",
  LAND_LEASE_FEE: "bg-indigo-100 text-indigo-800",
  COMPENSATION: "bg-orange-100 text-orange-800",
  RELOCATION: "bg-amber-100 text-amber-800",
  SITE_PREPARATION: "bg-teal-100 text-teal-800",
  LEGAL_FEES: "bg-gray-100 text-gray-700",
  TAX_AND_FEES: "bg-rose-100 text-rose-700",
  OTHER: "bg-gray-100 text-gray-600",
};

export default function LandCostTable({ costs, projectId, scenarioId }: Props) {
  const total = costs.reduce(
    (sum, c) => sum + parseFloat(c.totalAmount.toString()),
    0
  );

  const baseHref = `/du-an/${projectId}/kich-ban/${scenarioId}/chi-phi-dat`;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-600">
              Loại
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
              Tên mục
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
              Diện tích
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
              Đơn giá
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-gray-600">
              Thành tiền
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold text-gray-600">
              Tháng TT
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {costs.map((cost) => {
            const catKey = cost.category as LandCostCategoryKey;
            const badgeClass = CATEGORY_BADGE[catKey] ?? "bg-gray-100 text-gray-600";
            const showArea = AREA_BASED_CATEGORIES.has(catKey);
            return (
              <tr key={cost.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}
                  >
                    {LAND_COST_CATEGORY_LABELS[catKey] ?? cost.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-900">{cost.name}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {showArea ? formatArea(cost.area) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {showArea ? formatUnitPrice(cost.unitPrice) : "—"}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {formatVND(cost.totalAmount)}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">
                  T{cost.paymentMonth}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`${baseHref}/${cost.id}/sua`}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Sửa
                    </Link>
                    <DeleteLandCostButton
                      costId={cost.id}
                      scenarioId={scenarioId}
                      projectId={projectId}
                      costName={cost.name}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="border-t border-gray-200 bg-gray-50">
          <tr>
            <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700">
              Tổng chi phí đất
            </td>
            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
              {new Intl.NumberFormat("vi-VN").format(total) + " ₫"}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
