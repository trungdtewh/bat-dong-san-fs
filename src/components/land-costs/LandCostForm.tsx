"use client";

import { useState, useActionState, useMemo } from "react";
import Link from "next/link";
import {
  LAND_COST_CATEGORIES,
  LAND_COST_CATEGORY_LABELS,
  isAreaBased,
} from "@/lib/validations/land-cost";
import type { LandCostActionState } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-dat/actions";

export interface LandCostInitialData {
  category: string;
  name: string;
  description?: string | null;
  area?: number | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
  paymentMonth: number;
  notes?: string | null;
}

interface Props {
  action: (
    prev: LandCostActionState,
    formData: FormData
  ) => Promise<LandCostActionState>;
  initialData?: LandCostInitialData;
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

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

export default function LandCostForm({ action, initialData, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const e = state?.errors;

  const [category, setCategory] = useState(initialData?.category ?? "OTHER");
  const [area, setArea] = useState(
    initialData?.area != null ? String(initialData.area) : ""
  );
  const [unitPrice, setUnitPrice] = useState(
    initialData?.unitPrice != null ? String(initialData.unitPrice) : ""
  );

  const areaBased = isAreaBased(category);

  const computedTotal = useMemo(() => {
    const a = parseFloat(area);
    const u = parseFloat(unitPrice);
    if (!isNaN(a) && !isNaN(u) && a > 0 && u > 0) return Math.round(a * u);
    return null;
  }, [area, unitPrice]);

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        {/* Loại chi phí */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Loại chi phí <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(ev) => setCategory(ev.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {LAND_COST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {LAND_COST_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          <FieldError errors={e} name="category" />
        </div>

        {/* Tên mục */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Tên mục <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initialData?.name}
            placeholder="Ví dụ: Tiền sử dụng đất lô A"
            maxLength={200}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <FieldError errors={e} name="name" />
        </div>

        {/* Mô tả */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Mô tả
          </label>
          <input
            id="description"
            name="description"
            type="text"
            defaultValue={initialData?.description ?? undefined}
            placeholder="Mô tả ngắn (tùy chọn)"
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Phần nhập liệu tùy theo loại */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Thành tiền</h2>

        {areaBased ? (
          <>
            <p className="text-xs text-gray-400">
              Thành tiền = Diện tích × Đơn giá (tự tính)
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Diện tích */}
              <div>
                <label
                  htmlFor="area"
                  className="block text-sm font-medium text-gray-700"
                >
                  Diện tích <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="area"
                    name="area"
                    type="number"
                    min={0}
                    step={0.01}
                    value={area}
                    onChange={(ev) => setArea(ev.target.value)}
                    placeholder="0"
                    className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                    m²
                  </span>
                </div>
                <FieldError errors={e} name="area" />
              </div>

              {/* Đơn giá */}
              <div>
                <label
                  htmlFor="unitPrice"
                  className="block text-sm font-medium text-gray-700"
                >
                  Đơn giá <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="unitPrice"
                    name="unitPrice"
                    type="number"
                    min={0}
                    step={1}
                    value={unitPrice}
                    onChange={(ev) => setUnitPrice(ev.target.value)}
                    placeholder="0"
                    className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                    ₫/m²
                  </span>
                </div>
                <FieldError errors={e} name="unitPrice" />
              </div>
            </div>

            {/* Kết quả tính toán */}
            <div className="rounded-lg bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-600 font-medium">
                Thành tiền (tự tính):
              </p>
              <p className="mt-0.5 text-lg font-semibold text-blue-800">
                {computedTotal != null ? formatVND(computedTotal) : "—"}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400">Nhập trực tiếp thành tiền.</p>
            <div>
              <label
                htmlFor="totalAmount"
                className="block text-sm font-medium text-gray-700"
              >
                Thành tiền <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={initialData?.totalAmount ?? undefined}
                  placeholder="0"
                  className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                  ₫
                </span>
              </div>
              <FieldError errors={e} name="totalAmount" />
            </div>
          </>
        )}
      </div>

      {/* Tháng thanh toán */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="paymentMonth"
              className="block text-sm font-medium text-gray-700"
            >
              Tháng thanh toán <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="paymentMonth"
                name="paymentMonth"
                type="number"
                min={1}
                step={1}
                defaultValue={initialData?.paymentMonth}
                placeholder="1"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                tháng
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Tính từ tháng 1 của dự án
            </p>
            <FieldError errors={e} name="paymentMonth" />
          </div>
        </div>
      </div>

      {/* Ghi chú */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-gray-700"
        >
          Ghi chú
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initialData?.notes ?? undefined}
          placeholder="Ghi chú về mục chi phí này..."
          className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          {isPending ? "Đang lưu..." : "Lưu chi phí"}
        </button>
      </div>
    </form>
  );
}
