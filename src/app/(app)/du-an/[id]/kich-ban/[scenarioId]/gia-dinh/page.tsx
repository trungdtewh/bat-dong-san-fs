import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import { getScenarioById } from "@/lib/db/scenarios";
import { getAssumptionByScenarioId } from "@/lib/db/assumptions";

interface Props {
  params: Promise<{ id: string; scenarioId: string }>;
}

export const metadata: Metadata = {
  title: "Giả định tài chính | FS Dòng Tiền BĐS",
};

type Decimal = { toString(): string };

function fmt(d: Decimal | null | undefined): string {
  if (d == null) return "—";
  const n = parseFloat(d.toString()) * 100;
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}%`;
}

function fmtMonths(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${n} tháng`;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function GroupCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">{title}</h2>
      <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">{children}</dl>
    </div>
  );
}

export default async function GiaDinhPage({ params }: Props) {
  const { id: projectId, scenarioId } = await params;

  const [scenario, assumption] = await Promise.all([
    getScenarioById(scenarioId),
    getAssumptionByScenarioId(scenarioId),
  ]);

  if (!scenario || scenario.projectId !== projectId) notFound();

  const editHref = `/du-an/${projectId}/kich-ban/${scenarioId}/gia-dinh/chinh-sua`;

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
            <h1 className="text-2xl font-semibold text-gray-900">
              Giả định tài chính
            </h1>
            <p className="mt-1 text-sm text-gray-500">{scenario.name}</p>
          </div>
          <Link
            href={editHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {assumption ? (
              <>
                <Pencil className="h-4 w-4" />
                Chỉnh sửa
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Thêm giả định
              </>
            )}
          </Link>
        </div>
      </div>

      {!assumption ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <p className="text-sm font-medium text-gray-700">
            Chưa có giả định tài chính
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Thêm giả định để cấu hình các tham số tài chính cho kịch bản này.
          </p>
          <Link
            href={editHref}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm giả định
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <GroupCard title="Kinh tế vĩ mô">
            <InfoRow label="Tỷ lệ lạm phát" value={fmt(assumption.inflationRate)} />
            <InfoRow label="Tăng giá bán hằng năm" value={fmt(assumption.priceEscalationRate)} />
            <InfoRow label="Tăng chi phí xây dựng hằng năm" value={fmt(assumption.constructionEscalationRate)} />
            <InfoRow label="Tăng giá đất hằng năm" value={fmt(assumption.landPriceEscalationRate)} />
          </GroupCard>

          <GroupCard title="Thuế & Phí pháp lý">
            <InfoRow label="Thuế thu nhập DN" value={fmt(assumption.corporateTaxRate)} />
            <InfoRow label="Thuế GTGT" value={fmt(assumption.vatRate)} />
            <InfoRow label="Thuế chuyển nhượng đất" value={fmt(assumption.landTransferTaxRate)} />
          </GroupCard>

          <GroupCard title="Chi phí bán hàng">
            <InfoRow label="Phí môi giới" value={fmt(assumption.salesCommissionRate)} />
            <InfoRow label="Chi phí marketing" value={fmt(assumption.marketingCostRate)} />
          </GroupCard>

          <GroupCard title="Dự phòng & Rủi ro">
            <InfoRow label="Dự phòng chi phí" value={fmt(assumption.contingencyRate)} />
          </GroupCard>

          <GroupCard title="Cấu trúc vốn & Vay">
            <InfoRow label="Tỷ lệ vốn vay" value={fmt(assumption.debtRatio)} />
            <InfoRow label="Tỷ lệ vốn chủ sở hữu" value={fmt(assumption.equityRatio)} />
            <InfoRow label="Lãi suất vay" value={fmt(assumption.loanInterestRate)} />
            <InfoRow label="Thời gian vay" value={fmtMonths(assumption.loanTenorMonths)} />
            <InfoRow label="Ân hạn gốc" value={fmtMonths(assumption.gracePeriodMonths)} />
          </GroupCard>

          {assumption.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Ghi chú</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-600">{assumption.notes}</p>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">Thông tin hệ thống</h2>
            <dl className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              <InfoRow
                label="Cập nhật lần cuối"
                value={new Intl.DateTimeFormat("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(assumption.updatedAt)}
              />
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
