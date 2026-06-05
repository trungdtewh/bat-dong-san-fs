"use client";

import { useState, useActionState, useMemo } from "react";
import Link from "next/link";
import {
  DISTRIBUTION_TYPES,
  DISTRIBUTION_TYPE_LABELS,
  DISTRIBUTION_TYPE_HINTS,
} from "@/lib/validations/contract-package";
import type { ConstructionActionState } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-xay-dung/actions";

export interface PackageInitialData {
  name: string;
  contractorName?: string | null;
  contractValue: number;
  startMonth: number;
  endMonth: number;
  distributionType: string;
  customDistribution?: number[] | null;
  notes?: string | null;
}

interface Props {
  action: (
    prev: ConstructionActionState,
    formData: FormData
  ) => Promise<ConstructionActionState>;
  initialData?: PackageInitialData;
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

export default function PackageForm({ action, initialData, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const e = state?.errors;

  const [distributionType, setDistributionType] = useState(
    initialData?.distributionType ?? "UNIFORM"
  );
  const [startMonth, setStartMonth] = useState(
    initialData?.startMonth ? String(initialData.startMonth) : ""
  );
  const [endMonth, setEndMonth] = useState(
    initialData?.endMonth ? String(initialData.endMonth) : ""
  );
  const [contractValue, setContractValue] = useState(
    initialData?.contractValue ? String(initialData.contractValue) : ""
  );

  const numMonths = useMemo(() => {
    const s = parseInt(startMonth);
    const e2 = parseInt(endMonth);
    if (!isNaN(s) && !isNaN(e2) && e2 >= s) return e2 - s + 1;
    return 0;
  }, [startMonth, endMonth]);

  const initDist = useMemo(() => {
    if (initialData?.customDistribution?.length === numMonths) {
      return initialData.customDistribution.map(String);
    }
    if (numMonths > 0) {
      const even = (100 / numMonths).toFixed(2);
      return Array(numMonths).fill(even);
    }
    return [] as string[];
  }, [numMonths, initialData?.customDistribution]);

  const [distribution, setDistribution] = useState<string[]>(initDist);

  const distSum = useMemo(
    () => distribution.reduce((s, v) => s + (parseFloat(v) || 0), 0),
    [distribution]
  );

  const contractValueNum = parseFloat(contractValue);

  function handleMonthChange(
    setter: (v: string) => void,
    value: string
  ) {
    setter(value);
    if (distributionType === "MANUAL") {
      const s = parseInt(startMonth);
      const en = parseInt(endMonth);
      if (!isNaN(s) && !isNaN(en) && en >= s) {
        const n = en - s + 1;
        const even = (100 / n).toFixed(2);
        setDistribution(Array(n).fill(even));
      }
    }
  }

  const distributionJson =
    distributionType === "MANUAL" && distribution.length > 0
      ? JSON.stringify(distribution.map((v) => parseFloat(v) || 0))
      : "";

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Thông tin cơ bản */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Thông tin gói thầu</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Tên gói thầu <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initialData?.name}
            placeholder="Ví dụ: Gói thầu thi công phần kết cấu"
            maxLength={200}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <FieldError errors={e} name="name" />
        </div>

        <div>
          <label htmlFor="contractorName" className="block text-sm font-medium text-gray-700">
            Nhà thầu
          </label>
          <input
            id="contractorName"
            name="contractorName"
            type="text"
            defaultValue={initialData?.contractorName ?? undefined}
            placeholder="Tên công ty hoặc nhà thầu (tùy chọn)"
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="contractValue" className="block text-sm font-medium text-gray-700">
            Giá trị hợp đồng <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <input
              id="contractValue"
              name="contractValue"
              type="number"
              min={0}
              step={1}
              value={contractValue}
              onChange={(ev) => setContractValue(ev.target.value)}
              placeholder="0"
              className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
              ₫
            </span>
          </div>
          {contractValue && !isNaN(contractValueNum) && contractValueNum > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              {formatVND(contractValueNum)}
            </p>
          )}
          <FieldError errors={e} name="contractValue" />
        </div>
      </div>

      {/* Tiến độ thi công */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Tiến độ thi công</h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="startMonth" className="block text-sm font-medium text-gray-700">
              Tháng bắt đầu <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="startMonth"
                name="startMonth"
                type="number"
                min={1}
                step={1}
                value={startMonth}
                onChange={(ev) => handleMonthChange(setStartMonth, ev.target.value)}
                placeholder="1"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                tháng
              </span>
            </div>
            <FieldError errors={e} name="startMonth" />
          </div>

          <div>
            <label htmlFor="endMonth" className="block text-sm font-medium text-gray-700">
              Tháng kết thúc <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="endMonth"
                name="endMonth"
                type="number"
                min={1}
                step={1}
                value={endMonth}
                onChange={(ev) => handleMonthChange(setEndMonth, ev.target.value)}
                placeholder="12"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                tháng
              </span>
            </div>
            <FieldError errors={e} name="endMonth" />
          </div>
        </div>

        {numMonths > 0 && (
          <p className="text-xs text-blue-600 font-medium">
            Thời gian thi công: {numMonths} tháng
          </p>
        )}
      </div>

      {/* Phân bổ thanh toán */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Phân bổ thanh toán</h2>

        <div>
          <label htmlFor="distributionType" className="block text-sm font-medium text-gray-700">
            Kiểu phân bổ <span className="text-red-500">*</span>
          </label>
          <select
            id="distributionType"
            name="distributionType"
            value={distributionType}
            onChange={(ev) => setDistributionType(ev.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {DISTRIBUTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {DISTRIBUTION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">
            {DISTRIBUTION_TYPE_HINTS[distributionType as keyof typeof DISTRIBUTION_TYPE_HINTS]}
          </p>
        </div>

        {/* Nhập thủ công */}
        {distributionType === "MANUAL" && (
          <div>
            {numMonths === 0 ? (
              <p className="text-xs text-amber-600">
                Vui lòng nhập tháng bắt đầu và kết thúc trước.
              </p>
            ) : (
              <>
                <p className="mb-3 text-xs text-gray-500">
                  Nhập tỷ lệ % thanh toán cho từng tháng. Tổng phải bằng 100%.
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {distribution.map((val, i) => {
                    const month = parseInt(startMonth) + i;
                    return (
                      <div key={i}>
                        <label className="block text-xs text-gray-500 mb-0.5">
                          T{month}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={val}
                            onChange={(ev) => {
                              const next = [...distribution];
                              next[i] = ev.target.value;
                              setDistribution(next);
                            }}
                            className="block w-full rounded border border-gray-300 py-1 pl-2 pr-6 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-xs text-gray-400">
                            %
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div
                  className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${
                    Math.abs(distSum - 100) <= 0.5
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  Tổng: {distSum.toFixed(1)}%
                  {Math.abs(distSum - 100) > 0.5 && " — cần bằng 100%"}
                </div>

                <FieldError errors={e} name="customDistribution" />

                {/* Hidden field chứa JSON */}
                <input
                  type="hidden"
                  name="customDistribution"
                  value={distributionJson}
                />
              </>
            )}
          </div>
        )}
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
          placeholder="Ghi chú về gói thầu..."
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
          {isPending ? "Đang lưu..." : "Lưu gói thầu"}
        </button>
      </div>
    </form>
  );
}
