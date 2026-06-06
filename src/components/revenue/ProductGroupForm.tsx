"use client";

import { useState, useActionState, useMemo } from "react";
import Link from "next/link";
import {
  REVENUE_PRODUCT_TYPES,
  REVENUE_PRODUCT_TYPE_LABELS,
  PRICE_UNITS,
  PRICE_UNIT_LABELS,
} from "@/lib/validations/product-group";
import { computeBaseUnitPrice } from "@/lib/finance/revenue";
import type { RevenueActionState } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/doanh-thu/actions";

export interface GroupInitialData {
  productCode?: string | null;
  name: string;
  productType: string;
  totalUnits: number;
  priceUnit: string;
  area?: number | null;
  basePrice: number;
  vatRate: number;
  notes?: string | null;
}

interface Props {
  action: (prev: RevenueActionState, formData: FormData) => Promise<RevenueActionState>;
  initialData?: GroupInitialData;
  cancelHref: string;
}

function FieldError({ errors, name }: { errors?: Record<string, string[] | undefined>; name: string }) {
  const msgs = errors?.[name];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

export default function ProductGroupForm({ action, initialData, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const e = state?.errors;

  const [priceUnit, setPriceUnit] = useState(initialData?.priceUnit ?? "PER_SQM");
  const [area, setArea] = useState(initialData?.area ? String(initialData.area) : "");
  const [basePrice, setBasePrice] = useState(
    initialData?.basePrice ? String(initialData.basePrice) : ""
  );

  const unitPrice = useMemo(() => {
    const bp = parseFloat(basePrice);
    if (isNaN(bp) || bp <= 0) return null;
    if (priceUnit === "PER_SQM") {
      const a = parseFloat(area);
      if (isNaN(a) || a <= 0) return null;
      return computeBaseUnitPrice({ priceUnit: "PER_SQM", area: a, basePrice: bp });
    }
    return computeBaseUnitPrice({ priceUnit: "PER_UNIT", area: null, basePrice: bp });
  }, [priceUnit, area, basePrice]);

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Thông tin cơ bản */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Thông tin sản phẩm</h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Tên nhóm sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={initialData?.name}
              placeholder="Ví dụ: Căn hộ 2PN tầng thấp"
              maxLength={200}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FieldError errors={e} name="name" />
          </div>

          <div>
            <label htmlFor="productCode" className="block text-sm font-medium text-gray-700">
              Mã sản phẩm
            </label>
            <input
              id="productCode"
              name="productCode"
              type="text"
              defaultValue={initialData?.productCode ?? undefined}
              placeholder="VD: CH2PN-TL (tùy chọn)"
              maxLength={50}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FieldError errors={e} name="productCode" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="productType" className="block text-sm font-medium text-gray-700">
              Loại hình <span className="text-red-500">*</span>
            </label>
            <select
              id="productType"
              name="productType"
              defaultValue={initialData?.productType ?? "APARTMENT"}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {REVENUE_PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {REVENUE_PRODUCT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="totalUnits" className="block text-sm font-medium text-gray-700">
              Tổng số sản phẩm <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="totalUnits"
                name="totalUnits"
                type="number"
                min={1}
                step={1}
                defaultValue={initialData?.totalUnits}
                placeholder="0"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                căn/lô
              </span>
            </div>
            <FieldError errors={e} name="totalUnits" />
          </div>
        </div>
      </div>

      {/* Giá bán */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Giá bán</h2>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {PRICE_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setPriceUnit(u)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  priceUnit === u
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {PRICE_UNIT_LABELS[u]}
              </button>
            ))}
          </div>
        </div>

        <input type="hidden" name="priceUnit" value={priceUnit} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {priceUnit === "PER_SQM" && (
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                Diện tích mỗi căn <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  id="area"
                  name="area"
                  type="number"
                  min={0}
                  step={0.1}
                  value={area}
                  onChange={(ev) => setArea(ev.target.value)}
                  placeholder="0"
                  className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                  m²
                </span>
              </div>
              <FieldError errors={e} name="area" />
            </div>
          )}

          <div>
            <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
              {priceUnit === "PER_SQM" ? "Đơn giá (VND/m²)" : "Giá mỗi căn (VND)"}
              <span className="text-red-500"> *</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="basePrice"
                name="basePrice"
                type="number"
                min={0}
                step={1}
                value={basePrice}
                onChange={(ev) => setBasePrice(ev.target.value)}
                placeholder="0"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                ₫
              </span>
            </div>
            <FieldError errors={e} name="basePrice" />
          </div>
        </div>

        {unitPrice != null && unitPrice > 0 && (
          <div className="rounded-lg bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-600 font-medium">
              {priceUnit === "PER_SQM" ? "Giá mỗi căn:" : "Giá mỗi căn:"}
            </p>
            <p className="mt-0.5 text-lg font-semibold text-blue-800">{formatVND(unitPrice)}</p>
          </div>
        )}

        <div>
          <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700">
            Thuế GTGT (%)
          </label>
          <div className="relative mt-1.5">
            <input
              id="vatRate"
              name="vatRate"
              type="number"
              min={0}
              max={50}
              step={0.1}
              defaultValue={
                initialData?.vatRate != null
                  ? (initialData.vatRate * 100).toFixed(1)
                  : "10"
              }
              placeholder="10"
              className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
              %
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Căn hộ nhà ở: 10% · Đất nền chuyển nhượng: 0%
          </p>
          <FieldError errors={e} name="vatRate" />
        </div>
      </div>

      {/* Ghi chú */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Ghi chú
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={initialData?.notes ?? undefined}
          placeholder="Mô tả ngắn về nhóm sản phẩm..."
          className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
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
          {isPending ? "Đang lưu..." : "Lưu nhóm sản phẩm"}
        </button>
      </div>
    </form>
  );
}
