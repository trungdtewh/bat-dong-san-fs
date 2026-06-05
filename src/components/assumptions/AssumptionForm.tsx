"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AssumptionActionState } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/gia-dinh/actions";

export interface AssumptionInitialData {
  inflationRate: number;
  priceEscalationRate?: number | null;
  constructionEscalationRate?: number | null;
  landPriceEscalationRate?: number | null;
  corporateTaxRate: number;
  vatRate: number;
  landTransferTaxRate?: number | null;
  salesCommissionRate: number;
  marketingCostRate?: number | null;
  contingencyRate: number;
  debtRatio?: number | null;
  equityRatio?: number | null;
  loanInterestRate?: number | null;
  loanTenorMonths?: number | null;
  gracePeriodMonths?: number | null;
  notes?: string | null;
}

interface Props {
  action: (prev: AssumptionActionState, formData: FormData) => Promise<AssumptionActionState>;
  initialData?: AssumptionInitialData;
  cancelHref: string;
}

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[] | undefined>;
  name: string;
}) {
  const msgs = errors?.[name];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

function RateInput({
  id,
  label,
  required,
  placeholder,
  defaultValue,
  errors,
  hint,
}: {
  id: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: number;
  errors?: Record<string, string[] | undefined>;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          type="number"
          min={0}
          max={100}
          step={0.01}
          defaultValue={defaultValue}
          placeholder={placeholder ?? "0"}
          className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">
          %
        </span>
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      <FieldError errors={errors} name={id} />
    </div>
  );
}

function IntInput({
  id,
  label,
  unit,
  placeholder,
  defaultValue,
  errors,
}: {
  id: string;
  label: string;
  unit: string;
  placeholder?: string;
  defaultValue?: number | null;
  errors?: Record<string, string[] | undefined>;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={id}
          type="number"
          min={0}
          step={1}
          defaultValue={defaultValue ?? undefined}
          placeholder={placeholder ?? "0"}
          className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
          {unit}
        </span>
      </div>
      <FieldError errors={errors} name={id} />
    </div>
  );
}

export default function AssumptionForm({ action, initialData, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const e = state?.errors;

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Nhóm 1: Kinh tế vĩ mô */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Kinh tế vĩ mô</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <RateInput
            id="inflationRate"
            label="Tỷ lệ lạm phát"
            required
            placeholder="3.5"
            defaultValue={initialData?.inflationRate ?? undefined}
            errors={e}
            hint="% mỗi năm"
          />
          <RateInput
            id="priceEscalationRate"
            label="Tăng giá bán hằng năm"
            placeholder="8"
            defaultValue={initialData?.priceEscalationRate ?? undefined}
            errors={e}
            hint="% mỗi năm"
          />
          <RateInput
            id="constructionEscalationRate"
            label="Tăng chi phí xây dựng hằng năm"
            placeholder="5"
            defaultValue={initialData?.constructionEscalationRate ?? undefined}
            errors={e}
            hint="% mỗi năm"
          />
          <RateInput
            id="landPriceEscalationRate"
            label="Tăng giá đất hằng năm"
            placeholder="10"
            defaultValue={initialData?.landPriceEscalationRate ?? undefined}
            errors={e}
            hint="% mỗi năm"
          />
        </div>
      </div>

      {/* Nhóm 2: Thuế & Phí pháp lý */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Thuế &amp; Phí pháp lý</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <RateInput
            id="corporateTaxRate"
            label="Thuế thu nhập doanh nghiệp"
            required
            placeholder="20"
            defaultValue={initialData?.corporateTaxRate ?? undefined}
            errors={e}
          />
          <RateInput
            id="vatRate"
            label="Thuế GTGT"
            required
            placeholder="10"
            defaultValue={initialData?.vatRate ?? undefined}
            errors={e}
          />
          <RateInput
            id="landTransferTaxRate"
            label="Thuế chuyển nhượng đất"
            placeholder="2"
            defaultValue={initialData?.landTransferTaxRate ?? undefined}
            errors={e}
          />
        </div>
      </div>

      {/* Nhóm 3: Chi phí bán hàng */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Chi phí bán hàng</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <RateInput
            id="salesCommissionRate"
            label="Phí môi giới"
            required
            placeholder="2"
            defaultValue={initialData?.salesCommissionRate ?? undefined}
            errors={e}
            hint="% doanh thu"
          />
          <RateInput
            id="marketingCostRate"
            label="Chi phí marketing"
            placeholder="1.5"
            defaultValue={initialData?.marketingCostRate ?? undefined}
            errors={e}
            hint="% doanh thu"
          />
        </div>
      </div>

      {/* Nhóm 4: Dự phòng */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Dự phòng &amp; Rủi ro</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <RateInput
            id="contingencyRate"
            label="Dự phòng chi phí"
            required
            placeholder="5"
            defaultValue={initialData?.contingencyRate ?? undefined}
            errors={e}
            hint="% tổng chi phí"
          />
        </div>
      </div>

      {/* Nhóm 5: Cấu trúc vốn & Vay */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Cấu trúc vốn &amp; Vay</h2>
        <p className="mb-4 text-xs text-gray-400">
          Nếu nhập cả hai, tỷ lệ vốn vay + vốn chủ sở hữu phải bằng 100%.
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <RateInput
            id="debtRatio"
            label="Tỷ lệ vốn vay"
            placeholder="60"
            defaultValue={initialData?.debtRatio ?? undefined}
            errors={e}
          />
          <RateInput
            id="equityRatio"
            label="Tỷ lệ vốn chủ sở hữu"
            placeholder="40"
            defaultValue={initialData?.equityRatio ?? undefined}
            errors={e}
          />
          <RateInput
            id="loanInterestRate"
            label="Lãi suất vay"
            placeholder="10"
            defaultValue={initialData?.loanInterestRate ?? undefined}
            errors={e}
            hint="% mỗi năm"
          />
          <IntInput
            id="loanTenorMonths"
            label="Thời gian vay"
            unit="tháng"
            placeholder="24"
            defaultValue={initialData?.loanTenorMonths}
            errors={e}
          />
          <IntInput
            id="gracePeriodMonths"
            label="Ân hạn gốc"
            unit="tháng"
            placeholder="6"
            defaultValue={initialData?.gracePeriodMonths}
            errors={e}
          />
        </div>
      </div>

      {/* Ghi chú */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Ghi chú</h2>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initialData?.notes ?? undefined}
          placeholder="Ghi chú về các giả định đặc thù của kịch bản này..."
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Nút hành động */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href={cancelHref}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Hủy
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Đang lưu..." : "Lưu giả định"}
        </button>
      </div>
    </form>
  );
}
