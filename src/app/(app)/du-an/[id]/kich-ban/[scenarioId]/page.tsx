import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Star } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import ScenarioTypeBadge from "@/components/scenarios/ScenarioTypeBadge";
import DeleteScenarioButton from "@/components/scenarios/DeleteScenarioButton";
import CloneScenarioButton from "@/components/scenarios/CloneScenarioButton";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scenarioId } = await params;
  const scenario = await getScenarioById(scenarioId);
  return {
    title: scenario
      ? `${scenario.name} | FS Dòng Tiền BĐS`
      : "Kịch bản | FS Dòng Tiền BĐS",
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRate(rate: { toString(): string } | null | undefined): string {
  if (rate == null) return "—";
  const n = parseFloat(rate.toString()) * 100;
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}%`;
}

function formatMonths(months: number | null | undefined): string {
  if (months == null) return "—";
  return `${months} tháng`;
}

function formatMonth(month: number | null | undefined): string {
  if (month == null) return "—";
  return `Tháng ${month}`;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default async function ChiTietKichBanPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;
  const scenario = await getScenarioById(scenarioId);

  if (!scenario || scenario.projectId !== projectId) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/du-an/${projectId}/kich-ban`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại danh sách kịch bản
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">
                {scenario.name}
              </h1>
              <ScenarioTypeBadge type={scenario.type} />
              {scenario.isBase && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                  Kịch bản cơ sở
                </span>
              )}
            </div>
            {scenario.description && (
              <p className="mt-1.5 text-sm text-gray-500">
                {scenario.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/du-an/${projectId}/kich-ban/${scenarioId}/sua`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Chỉnh sửa
            </Link>
            <CloneScenarioButton
              id={scenarioId}
              projectId={projectId}
              scenarioName={scenario.name}
            />
            <DeleteScenarioButton
              id={scenarioId}
              projectId={projectId}
              scenarioName={scenario.name}
              isBase={scenario.isBase}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Thông tin kịch bản */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Thông tin kịch bản
          </h2>
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <InfoRow label="Tên kịch bản" value={scenario.name} />
            <InfoRow
              label="Loại kịch bản"
              value={<ScenarioTypeBadge type={scenario.type} />}
            />
            <InfoRow
              label="Kịch bản cơ sở"
              value={
                scenario.isBase ? (
                  <span className="text-amber-700 font-medium">Có</span>
                ) : (
                  "Không"
                )
              }
            />
            <InfoRow
              label="Phiên bản"
              value={`v${scenario.version}`}
            />
          </dl>
        </div>

        {/* Thời gian & Tài chính */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Thời gian &amp; Tài chính
          </h2>
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <InfoRow
              label="Thời gian dự án"
              value={formatMonths(scenario.durationMonths)}
            />
            <InfoRow
              label="Tỷ lệ chiết khấu"
              value={formatRate(scenario.discountRate)}
            />
            <InfoRow
              label="Tháng bắt đầu xây dựng"
              value={formatMonth(scenario.constructionStartMonth)}
            />
            <InfoRow
              label="Tháng bắt đầu bán hàng"
              value={formatMonth(scenario.salesStartMonth)}
            />
            <InfoRow
              label="Tháng bắt đầu bàn giao"
              value={formatMonth(scenario.handoverStartMonth)}
            />
          </dl>
        </div>

        {/* Giả định */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Giả định tài chính</h2>
            <Link
              href={`/du-an/${projectId}/kich-ban/${scenarioId}/gia-dinh`}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>
          {scenario.assumption ? (
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              <InfoRow
                label="Thuế thu nhập DN"
                value={formatRate(scenario.assumption.corporateTaxRate)}
              />
              <InfoRow
                label="Thuế GTGT"
                value={formatRate(scenario.assumption.vatRate)}
              />
              <InfoRow
                label="Lạm phát"
                value={formatRate(scenario.assumption.inflationRate)}
              />
              <InfoRow
                label="Phí môi giới"
                value={formatRate(scenario.assumption.salesCommissionRate)}
              />
              <InfoRow
                label="Dự phòng"
                value={formatRate(scenario.assumption.contingencyRate)}
              />
            </dl>
          ) : (
            <p className="text-sm text-gray-400">
              Chưa có giả định tài chính.{" "}
              <Link
                href={`/du-an/${projectId}/kich-ban/${scenarioId}/gia-dinh`}
                className="text-blue-600 hover:underline"
              >
                Thêm giả định
              </Link>
            </p>
          )}
        </div>

        {/* Kịch bản con */}
        {scenario.childScenarios.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">
              Kịch bản nhân bản từ đây ({scenario.childScenarios.length})
            </h2>
            <ul className="space-y-2">
              {scenario.childScenarios.map((child) => (
                <li key={child.id} className="flex items-center gap-3">
                  <ScenarioTypeBadge type={child.type} />
                  <Link
                    href={`/du-an/${projectId}/kich-ban/${child.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Thông tin hệ thống */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Thông tin hệ thống
          </h2>
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
            <InfoRow label="Ngày tạo" value={formatDate(scenario.createdAt)} />
            <InfoRow
              label="Cập nhật lần cuối"
              value={formatDate(scenario.updatedAt)}
            />
            {scenario.parentScenario && (
              <InfoRow
                label="Nhân bản từ"
                value={
                  <Link
                    href={`/du-an/${projectId}/kich-ban/${scenario.parentScenario.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {scenario.parentScenario.name}
                  </Link>
                }
              />
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
