"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ConstructionActionState } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/chi-phi-xay-dung/actions";

export interface PhaseInitialData {
  name: string;
  startMonth: number;
  endMonth: number;
  description?: string | null;
}

interface Props {
  action: (
    prev: ConstructionActionState,
    formData: FormData
  ) => Promise<ConstructionActionState>;
  initialData?: PhaseInitialData;
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

export default function PhaseForm({ action, initialData, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const e = state?.errors;

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        {/* Tên giai đoạn */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Tên giai đoạn <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initialData?.name}
            placeholder="Ví dụ: Thi công phần thô"
            maxLength={200}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <FieldError errors={e} name="name" />
        </div>

        {/* Tháng bắt đầu & kết thúc */}
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
                defaultValue={initialData?.startMonth}
                placeholder="1"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">
                tháng
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Tính từ tháng 1 của dự án</p>
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
                defaultValue={initialData?.endMonth}
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

        {/* Mô tả */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Mô tả
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={initialData?.description ?? undefined}
            placeholder="Mô tả ngắn về giai đoạn thi công..."
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
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
          {isPending ? "Đang lưu..." : "Lưu giai đoạn"}
        </button>
      </div>
    </form>
  );
}
