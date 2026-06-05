"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  PROVINCES,
} from "@/lib/validations/project";
import type { ActionState } from "@/app/(app)/du-an/actions";

interface InitialData {
  code: string;
  name: string;
  type: string;
  province: string;
  status: string;
  totalArea: number;
  grossFloorArea?: number | null;
  commercialArea?: number | null;
}

interface ProjectFormProps {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initialData?: InitialData;
  cancelHref: string;
  submitLabel: string;
}

function FieldError({ errors, name }: { errors?: Record<string, string[] | undefined>; name: string }) {
  const msgs = errors?.[name];
  if (!msgs || msgs.length === 0) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

export default function ProjectForm({
  action,
  initialData,
  cancelHref,
  submitLabel,
}: ProjectFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Thông tin cơ bản</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Mã dự án */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Mã dự án <span className="text-red-500">*</span>
            </label>
            <input
              id="code"
              name="code"
              type="text"
              defaultValue={initialData?.code}
              placeholder="Ví dụ: DA-HN-2024-001"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FieldError errors={state?.errors} name="code" />
          </div>

          {/* Tên dự án */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Tên dự án <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={initialData?.name}
              placeholder="Nhập tên dự án"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FieldError errors={state?.errors} name="name" />
          </div>

          {/* Loại dự án */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Loại dự án <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              defaultValue={initialData?.type ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>Chọn loại dự án</option>
              {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <FieldError errors={state?.errors} name="type" />
          </div>

          {/* Tỉnh/Thành phố */}
          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <select
              id="province"
              name="province"
              defaultValue={initialData?.province ?? ""}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>Chọn tỉnh/thành phố</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <FieldError errors={state?.errors} name="province" />
          </div>

          {/* Trạng thái */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              defaultValue={initialData?.status ?? "PLANNING"}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <FieldError errors={state?.errors} name="status" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold text-gray-700">Thông tin diện tích</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Diện tích đất */}
          <div>
            <label htmlFor="totalArea" className="block text-sm font-medium text-gray-700">
              Diện tích đất (m²) <span className="text-red-500">*</span>
            </label>
            <input
              id="totalArea"
              name="totalArea"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initialData?.totalArea}
              placeholder="0"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FieldError errors={state?.errors} name="totalArea" />
          </div>

          {/* Tổng diện tích sàn */}
          <div>
            <label htmlFor="grossFloorArea" className="block text-sm font-medium text-gray-700">
              Tổng diện tích sàn (m²)
            </label>
            <input
              id="grossFloorArea"
              name="grossFloorArea"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initialData?.grossFloorArea ?? undefined}
              placeholder="0"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FieldError errors={state?.errors} name="grossFloorArea" />
          </div>

          {/* Tổng diện tích kinh doanh */}
          <div>
            <label htmlFor="commercialArea" className="block text-sm font-medium text-gray-700">
              Tổng diện tích kinh doanh (m²)
            </label>
            <input
              id="commercialArea"
              name="commercialArea"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initialData?.commercialArea ?? undefined}
              placeholder="0"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FieldError errors={state?.errors} name="commercialArea" />
          </div>
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
