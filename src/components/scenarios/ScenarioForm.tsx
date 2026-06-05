"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { SCENARIO_TYPE_LABELS } from "@/lib/validations/scenario";
import type { ActionState } from "@/app/(app)/du-an/[id]/kich-ban/actions";

interface InitialData {
  name: string;
  type: string;
  isBase: boolean;
  description?: string | null;
  durationMonths?: number | null;
  constructionStartMonth?: number | null;
  salesStartMonth?: number | null;
  handoverStartMonth?: number | null;
  discountRate?: number | null;
}

interface Props {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initialData?: InitialData;
  cancelHref: string;
  submitLabel: string;
  disableIsBase?: boolean;
}

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[] | undefined>;
  name: string;
}) {
  const msgs = errors?.[name];
  if (!msgs || msgs.length === 0) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

export default function ScenarioForm({
  action,
  initialData,
  cancelHref,
  submitLabel,
  disableIsBase = false,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  const [type, setType] = useState(initialData?.type ?? "BASE");
  const [isBase, setIsBase] = useState(initialData?.isBase ?? false);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === "BASE" && !disableIsBase) setIsBase(true);
    if (newType !== "BASE") setIsBase(false);
  };

  return (
    <form action={formAction} className="space-y-6">
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Hidden inputs cho controlled state */}
      <input type="hidden" name="isBase" value={isBase ? "true" : "false"} />

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">
          Thông tin kịch bản
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Tên kịch bản */}
          <div className="sm:col-span-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Tên kịch bản <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={initialData?.name}
              placeholder="Ví dụ: Kịch bản cơ sở 2025"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FieldError errors={state?.errors} name="name" />
          </div>

          {/* Loại kịch bản */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700"
            >
              Loại kịch bản <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(SCENARIO_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldError errors={state?.errors} name="type" />
          </div>

          {/* Kịch bản cơ sở */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  id="isBaseCheckbox"
                  checked={isBase}
                  onChange={(e) => !disableIsBase && setIsBase(e.target.checked)}
                  disabled={disableIsBase}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                Đặt làm kịch bản cơ sở
              </span>
            </label>
            {disableIsBase && (
              <p className="mt-1.5 text-xs text-amber-600">
                Dự án đã có kịch bản cơ sở. Không thể đặt thêm kịch bản cơ sở khác.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Thời gian & Tài chính */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">
          Thời gian &amp; Tài chính
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Thời gian dự án */}
          <div>
            <label
              htmlFor="durationMonths"
              className="block text-sm font-medium text-gray-700"
            >
              Thời gian dự án (tháng)
            </label>
            <input
              id="durationMonths"
              name="durationMonths"
              type="number"
              min={1}
              max={600}
              defaultValue={initialData?.durationMonths ?? undefined}
              placeholder="Ví dụ: 36"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FieldError errors={state?.errors} name="durationMonths" />
          </div>

          {/* Tỷ lệ chiết khấu */}
          <div>
            <label
              htmlFor="discountRate"
              className="block text-sm font-medium text-gray-700"
            >
              Tỷ lệ chiết khấu (%)
            </label>
            <input
              id="discountRate"
              name="discountRate"
              type="number"
              min={0}
              max={100}
              step={0.01}
              defaultValue={initialData?.discountRate ?? undefined}
              placeholder="Ví dụ: 12.5"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FieldError errors={state?.errors} name="discountRate" />
          </div>

          {/* Tháng bắt đầu xây dựng */}
          <div>
            <label
              htmlFor="constructionStartMonth"
              className="block text-sm font-medium text-gray-700"
            >
              Tháng bắt đầu xây dựng
            </label>
            <input
              id="constructionStartMonth"
              name="constructionStartMonth"
              type="number"
              min={1}
              max={600}
              defaultValue={initialData?.constructionStartMonth ?? undefined}
              placeholder="Ví dụ: 3"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Tính từ tháng 1 của dự án
            </p>
            <FieldError errors={state?.errors} name="constructionStartMonth" />
          </div>

          {/* Tháng bắt đầu bán hàng */}
          <div>
            <label
              htmlFor="salesStartMonth"
              className="block text-sm font-medium text-gray-700"
            >
              Tháng bắt đầu bán hàng
            </label>
            <input
              id="salesStartMonth"
              name="salesStartMonth"
              type="number"
              min={1}
              max={600}
              defaultValue={initialData?.salesStartMonth ?? undefined}
              placeholder="Ví dụ: 6"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Tính từ tháng 1 của dự án
            </p>
            <FieldError errors={state?.errors} name="salesStartMonth" />
          </div>

          {/* Tháng bắt đầu bàn giao */}
          <div>
            <label
              htmlFor="handoverStartMonth"
              className="block text-sm font-medium text-gray-700"
            >
              Tháng bắt đầu bàn giao
            </label>
            <input
              id="handoverStartMonth"
              name="handoverStartMonth"
              type="number"
              min={1}
              max={600}
              defaultValue={initialData?.handoverStartMonth ?? undefined}
              placeholder="Ví dụ: 24"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Tính từ tháng 1 của dự án
            </p>
            <FieldError errors={state?.errors} name="handoverStartMonth" />
          </div>
        </div>
      </div>

      {/* Mô tả */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Mô tả</h2>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Mô tả kịch bản
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={initialData?.description ?? undefined}
            placeholder="Nhập mô tả về giả định, bối cảnh của kịch bản này..."
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
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
          {isPending ? "Đang xử lý..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
