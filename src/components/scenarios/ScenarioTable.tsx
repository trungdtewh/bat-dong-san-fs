import Link from "next/link";
import { GitBranch, Star } from "lucide-react";
import ScenarioTypeBadge from "./ScenarioTypeBadge";
import DeleteScenarioButton from "./DeleteScenarioButton";
import CloneScenarioButton from "./CloneScenarioButton";
import type { ScenarioListItem } from "@/lib/db/scenarios";

interface Props {
  scenarios: ScenarioListItem[];
  projectId: string;
}

function formatDurationMonths(months: number | null | undefined): string {
  if (months == null) return "—";
  return `${months} tháng`;
}

function formatDiscountRate(
  rate: { toString(): string } | null | undefined
): string {
  if (rate == null) return "—";
  const n = parseFloat(rate.toString()) * 100;
  const formatted = n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
  return `${formatted}%`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default function ScenarioTable({ scenarios, projectId }: Props) {
  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <GitBranch className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-800">
          Chưa có kịch bản nào
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-gray-500">
          Tạo kịch bản đầu tiên để bắt đầu phân tích tài chính dự án.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tên kịch bản
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Loại
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Cơ sở
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Thời gian dự án
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tỷ lệ chiết khấu
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Ngày tạo
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {scenarios.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
              {/* Tên kịch bản */}
              <td className="px-4 py-3">
                <Link
                  href={`/du-an/${projectId}/kich-ban/${s.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {s.name}
                </Link>
                {s.description && (
                  <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                    {s.description}
                  </p>
                )}
              </td>

              {/* Loại kịch bản */}
              <td className="px-4 py-3">
                <ScenarioTypeBadge type={s.type} />
              </td>

              {/* Kịch bản cơ sở */}
              <td className="px-4 py-3">
                {s.isBase ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    Cơ sở
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>

              {/* Thời gian dự án */}
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                {formatDurationMonths(s.durationMonths)}
              </td>

              {/* Tỷ lệ chiết khấu */}
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatDiscountRate(s.discountRate)}
              </td>

              {/* Ngày tạo */}
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                {formatDate(s.createdAt)}
              </td>

              {/* Hành động */}
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/du-an/${projectId}/kich-ban/${s.id}/sua`}
                    className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Sửa
                  </Link>
                  <CloneScenarioButton
                    id={s.id}
                    projectId={projectId}
                    scenarioName={s.name}
                  />
                  <DeleteScenarioButton
                    id={s.id}
                    projectId={projectId}
                    scenarioName={s.name}
                    isBase={s.isBase}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
