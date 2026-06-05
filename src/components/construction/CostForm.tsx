"use client";

import { useState, useActionState, useMemo } from "react";
import Link from "next/link";
import {
  CONSTRUCTION_COST_CATEGORIES,
  CONSTRUCTION_COST_CATEGORY_LABELS,
} from "@/lib/validations/construction-cost";
import type { ConstructionActionState } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-xay-dung/actions";

export interface CostInitialData {
  category: string;
  name: string;
  description?: string | null;
  unit?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  totalAmount?: number | null;
}

interface Props {
  action: (
    prev: ConstructionActionState,
    formData: FormData
  ) => Promise<ConstructionActionState>;
  initialData?: CostInitialData;
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

export default function CostForm({ action, initialData, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const e = state?.errors;

  const hasInitialQuantity =
    initialData?.quantity != null && initialData?.unitPrice != null;

  const [inputMode, setInputMode] = useState<"quantity" | "fixed">(
    hasInitialQuantity ? "quantity" : "fixed"
  );
  const [quantity, setQuantity] = useState(
    initialData?.quantity != null ? String(initialData.quantity) : ""
  );
  const [unitPrice, setUnitPrice] = useState(
    initialData?.unitPrice != null ? String(initialData.unitPrice) : ""
  );

  const computedTotal = useMemo(() => {
    const q = parseFloat(quantity);
    const u = parseFloat(unitPrice);
    if (!isNaN(q) && !isNaN(u) && q > 0 && u > 0) return Math.round(q * u);
    return null;
  }, [quantity, unitPrice]);

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <input type="hidden" name="inputMode" value={inputMode} />

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        {/* Loại hạng mục */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Loại hạng mục <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initialData?.category ?? "OTHER"}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {CONSTRUCTION_COST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CONSTRUCTION_COST_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
          <FieldError errors={e} name="category" />
        </div>

        {/* Tên hạng mục */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Tên hạng mục <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initialData?.name}
            placeholder="Ví dụ: Bê tông cột vách tầng 1-5"
            maxLength={200}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <FieldError errors={e} name="name" />
        </div>

        {/* Mô tả */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
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

      {/* Thành tiền */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Thành tiền</h2>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setInputMode("quantity")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                inputMode === "quantity"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Theo khối lượng
            </button>
            <button
              type="button"
              onClick={() => setInputMode("fixed")}
              className={`px-3 py-1.5 font-medium transition-colors ${
                inputMode === "fixed"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Tổng tiền
            </button>
          </div>
        </div>

        {inputMode === "quantity" ? (
          <>
            <p className="text-xs text-gray-400">
              Thành tiền = Khối lượng × Đơn giá (tự tính)
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {/* Khối lượng */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Khối lượng <span className="text-red-500">*</span>
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={0}
                  step={0.01}
                  value={quantity}
                  onChange={(ev) => setQuantity(ev.target.value)}
                  placeholder="0"
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <FieldError errors={e} name="quantity" />
              </div>

              {/* Đơn vị */}
              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                  Đơn vị
                </label>
                <input
                  id="unit"
                  name="unit"
                  type="text"
                  defaultValue={initialData?.unit ?? undefined}
                  placeholder="m³, m², tấn..."
                  maxLength={20}
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Đơn giá */}
              <div>
                <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">
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
                    className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                    ₫
                  </span>
                </div>
                <FieldError errors={e} name="unitPrice" />
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 px-4 py-3">
              <p className="text-xs text-blue-600 font-medium">Thành tiền (tự tính):</p>
              <p className="mt-0.5 text-lg font-semibold text-blue-800">
                {computedTotal != null ? formatVND(computedTotal) : "—"}
              </p>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400">Nhập trực tiếp thành tiền.</p>
            <div>
              <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
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
          {isPending ? "Đang lưu..." : "Lưu hạng mục"}
        </button>
      </div>
    </form>
  );
}
