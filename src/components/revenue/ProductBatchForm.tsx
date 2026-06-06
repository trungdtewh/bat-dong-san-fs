"use client";

import { useState, useActionState, useMemo } from "react";
import Link from "next/link";
import { COLLECTION_PRESETS } from "@/lib/validations/product-batch";
import type { CollectionInstallment } from "@/lib/validations/product-batch";
import {
  computeBatchUnitPrice,
  computeAbsorptionMonths,
} from "@/lib/finance/revenue";
import type { PriceUnit } from "@/generated/prisma/client";
import type { RevenueActionState } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/doanh-thu/actions";

export interface BatchFormGroupContext {
  basePrice: number;
  area: number | null;
  priceUnit: PriceUnit;
  totalUnits: number;
  usedUnits: number;
}

export interface BatchInitialData {
  name: string;
  launchMonth: number;
  unitsOffered: number;
  priceAdjustmentRate: number;
  salesVelocity: number;
  collectionSchedule: CollectionInstallment[];
  notes?: string | null;
}

interface Props {
  action: (prev: RevenueActionState, formData: FormData) => Promise<RevenueActionState>;
  group: BatchFormGroupContext;
  initialData?: BatchInitialData;
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

const DEFAULT_SCHEDULE = COLLECTION_PRESETS.STANDARD_5.schedule;

export default function ProductBatchForm({ action, group, initialData, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const e = state?.errors;

  const [priceAdjRate, setPriceAdjRate] = useState(
    initialData ? String(initialData.priceAdjustmentRate * 100) : "0"
  );
  const [salesVelocity, setSalesVelocity] = useState(
    initialData ? String(initialData.salesVelocity) : ""
  );
  const [unitsOffered, setUnitsOffered] = useState(
    initialData ? String(initialData.unitsOffered) : ""
  );
  const [launchMonth, setLaunchMonth] = useState(
    initialData ? String(initialData.launchMonth) : ""
  );
  const [schedule, setSchedule] = useState<CollectionInstallment[]>(
    initialData?.collectionSchedule ?? DEFAULT_SCHEDULE
  );

  const adjRate = parseFloat(priceAdjRate) / 100;
  const unitPrice = useMemo(() => {
    if (isNaN(adjRate)) return null;
    const p = computeBatchUnitPrice(
      { priceUnit: group.priceUnit, area: group.area, basePrice: group.basePrice },
      adjRate
    );
    return p > 0 ? p : null;
  }, [group, adjRate]);

  const absorptionInfo = useMemo(() => {
    const u = parseFloat(unitsOffered);
    const v = parseFloat(salesVelocity);
    const lm = parseInt(launchMonth);
    if (isNaN(u) || isNaN(v) || v <= 0 || u <= 0) return null;
    const months = computeAbsorptionMonths(u, v);
    const lastMonth = isNaN(lm) ? null : lm + months - 1;
    return { months, lastMonth };
  }, [unitsOffered, salesVelocity, launchMonth]);

  const scheduleSum = useMemo(
    () => schedule.reduce((s, row) => s + (row.percent || 0), 0),
    [schedule]
  );

  const scheduleJson = JSON.stringify(schedule);

  const remainingUnits = group.totalUnits - group.usedUnits;

  function applyPreset(key: string) {
    const preset = COLLECTION_PRESETS[key];
    if (preset) setSchedule(preset.schedule.map((r) => ({ ...r })));
  }

  function updateRow(idx: number, field: keyof CollectionInstallment, value: string | number) {
    setSchedule((prev) => {
      const next = prev.map((r, i) =>
        i === idx ? { ...r, [field]: field === "label" ? value : Number(value) } : r
      );
      return next;
    });
  }

  function addRow() {
    setSchedule((prev) => [
      ...prev,
      { percent: 0, offsetMonths: 0, label: "Đợt thanh toán mới" },
    ]);
  }

  function removeRow(idx: number) {
    setSchedule((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Thông tin đợt */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Thông tin đợt mở bán</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Tên đợt <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initialData?.name}
            placeholder="Ví dụ: Đợt 1 — Mở bán chính thức"
            maxLength={200}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <FieldError errors={e} name="name" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="launchMonth" className="block text-sm font-medium text-gray-700">
              Tháng mở bán <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="launchMonth"
                name="launchMonth"
                type="number"
                min={1}
                step={1}
                value={launchMonth}
                onChange={(ev) => setLaunchMonth(ev.target.value)}
                placeholder="1"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                tháng
              </span>
            </div>
            <FieldError errors={e} name="launchMonth" />
          </div>

          <div>
            <label htmlFor="unitsOffered" className="block text-sm font-medium text-gray-700">
              Số sản phẩm mở bán <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="unitsOffered"
                name="unitsOffered"
                type="number"
                min={1}
                step={1}
                value={unitsOffered}
                onChange={(ev) => setUnitsOffered(ev.target.value)}
                placeholder="0"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                căn
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Còn lại: {remainingUnits} / {group.totalUnits} căn
            </p>
            <FieldError errors={e} name="unitsOffered" />
          </div>

          <div>
            <label htmlFor="salesVelocity" className="block text-sm font-medium text-gray-700">
              Tốc độ hấp thụ <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="salesVelocity"
                name="salesVelocity"
                type="number"
                min={0.1}
                step={0.1}
                value={salesVelocity}
                onChange={(ev) => setSalesVelocity(ev.target.value)}
                placeholder="0"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-20 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                căn/tháng
              </span>
            </div>
            <FieldError errors={e} name="salesVelocity" />
          </div>
        </div>

        {absorptionInfo && (
          <div className="rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
            Bán hết sau{" "}
            <span className="font-semibold">{absorptionInfo.months} tháng</span>
            {absorptionInfo.lastMonth != null && (
              <> — tháng <span className="font-semibold">{absorptionInfo.lastMonth}</span></>
            )}
          </div>
        )}
      </div>

      {/* Giá bán */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Giá bán</h2>

        <div>
          <label htmlFor="priceAdjustmentRate" className="block text-sm font-medium text-gray-700">
            Điều chỉnh giá so với giá gốc (%)
          </label>
          <div className="relative mt-1.5">
            <input
              id="priceAdjustmentRate"
              name="priceAdjustmentRate"
              type="number"
              step={0.1}
              value={priceAdjRate}
              onChange={(ev) => setPriceAdjRate(ev.target.value)}
              placeholder="0"
              className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
              %
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            0 = giữ nguyên · +5 = tăng 5% · -10 = giảm 10%
          </p>
          <FieldError errors={e} name="priceAdjustmentRate" />
        </div>

        {unitPrice != null && (
          <div className="rounded-lg bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-600 font-medium">Giá bán mỗi căn đợt này:</p>
            <p className="mt-0.5 text-lg font-semibold text-blue-800">{formatVND(unitPrice)}</p>
          </div>
        )}
      </div>

      {/* Tiến độ thu tiền */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-700">Tiến độ thu tiền</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(COLLECTION_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className="rounded border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Tỷ lệ % thu theo từng mốc — tính từ tháng ký hợp đồng.
        </p>

        <div className="overflow-hidden rounded-lg border border-gray-100">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-500 w-1/2">Nhãn đợt thu</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-500 w-1/6">Tỷ lệ (%)</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-500 w-1/6">Tháng thu</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {schedule.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(ev) => updateRow(idx, "label", ev.target.value)}
                      maxLength={100}
                      className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-slate-900 focus:border-blue-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={row.percent}
                        onChange={(ev) => updateRow(idx, "percent", ev.target.value)}
                        className="w-full rounded border border-gray-200 py-1 pl-2 pr-6 text-xs text-slate-900 text-right focus:border-blue-400 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-xs text-gray-400">%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={row.offsetMonths}
                        onChange={(ev) => updateRow(idx, "offsetMonths", ev.target.value)}
                        className="w-full rounded border border-gray-200 py-1 pl-2 pr-8 text-xs text-slate-900 text-right focus:border-blue-400 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-xs text-gray-400">T+</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {schedule.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="rounded p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Xóa dòng"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-3 py-2 text-xs font-semibold text-gray-600">Tổng</td>
                <td
                  className={`px-3 py-2 text-center text-xs font-bold ${
                    Math.abs(scheduleSum - 100) <= 0.01
                      ? "text-green-700"
                      : "text-amber-700"
                  }`}
                >
                  {scheduleSum.toFixed(1)}%
                  {Math.abs(scheduleSum - 100) > 0.01 && " ≠ 100%"}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {schedule.length < 24 && (
          <button
            type="button"
            onClick={addRow}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            + Thêm đợt thu tiền
          </button>
        )}

        <input type="hidden" name="collectionScheduleJson" value={scheduleJson} />
        <FieldError errors={e} name="collectionScheduleJson" />
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
          placeholder="Ghi chú về đợt mở bán..."
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
          {isPending ? "Đang lưu..." : "Lưu đợt mở bán"}
        </button>
      </div>
    </form>
  );
}
