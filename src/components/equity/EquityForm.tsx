"use client";

import { useState, useActionState, useMemo } from "react";
import Link from "next/link";
import {
  EQUITY_SOURCE_TYPES,
  EQUITY_SOURCE_TYPE_LABELS,
} from "@/lib/validations/equity-contribution";
import type { DisbursementFormItem } from "@/lib/validations/equity-contribution";
import type { EquityActionState } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/von-vay/gop-von/actions";

export interface EquityInitialData {
  name: string;
  contributorName?: string | null;
  sourceType: string;
  totalAmount: number;
  disbursements: DisbursementFormItem[];
  notes?: string | null;
}

interface Props {
  action: (prev: EquityActionState, formData: FormData) => Promise<EquityActionState>;
  initialData?: EquityInitialData;
  cancelHref: string;
}

function FieldError({ errors, name }: { errors?: Record<string, string[] | undefined>; name: string }) {
  const msgs = errors?.[name];
  if (!msgs?.length) return null;
  return <p className="mt-1 text-xs text-red-600">{msgs[0]}</p>;
}

function formatVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";
}

const DEFAULT_DISBURSEMENTS: DisbursementFormItem[] = [
  { projectMonth: 1, amount: 0, description: "" },
];

export default function EquityForm({ action, initialData, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const e = state?.errors;

  const [totalAmount, setTotalAmount] = useState(
    initialData ? String(initialData.totalAmount) : ""
  );
  const [disbursements, setDisbursements] = useState<DisbursementFormItem[]>(
    initialData?.disbursements.length ? initialData.disbursements : DEFAULT_DISBURSEMENTS
  );

  const disbTotal = useMemo(
    () => disbursements.reduce((s, d) => s + (d.amount || 0), 0),
    [disbursements]
  );
  const total = parseFloat(totalAmount) || 0;
  const disbMismatch = total > 0 && Math.abs(disbTotal - total) > 1;
  const disbJson = JSON.stringify(disbursements);

  function addDisbRow() {
    setDisbursements((prev) => [
      ...prev,
      { projectMonth: 1, amount: 0, description: "" },
    ]);
  }
  function removeDisbRow(idx: number) {
    setDisbursements((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateDisbRow(idx: number, field: keyof DisbursementFormItem, value: string | number) {
    setDisbursements((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, [field]: field === "description" ? value : Number(value) }
          : r
      )
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state && !state.success && state.message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Thông tin chung */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Thông tin góp vốn</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Tên đợt góp vốn <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initialData?.name}
            placeholder="Ví dụ: Vốn chủ sở hữu giai đoạn 1"
            maxLength={200}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <FieldError errors={e} name="name" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contributorName" className="block text-sm font-medium text-gray-700">
              Nhà đầu tư / Cổ đông
            </label>
            <input
              id="contributorName"
              name="contributorName"
              type="text"
              defaultValue={initialData?.contributorName ?? undefined}
              placeholder="Tên tổ chức / cá nhân"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="sourceType" className="block text-sm font-medium text-gray-700">
              Loại nguồn vốn <span className="text-red-500">*</span>
            </label>
            <select
              id="sourceType"
              name="sourceType"
              defaultValue={initialData?.sourceType ?? "OWNER_EQUITY"}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {EQUITY_SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>{EQUITY_SOURCE_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <FieldError errors={e} name="sourceType" />
          </div>
        </div>

        <div>
          <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
            Tổng số tiền góp <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1.5">
            <input
              id="totalAmount"
              name="totalAmount"
              type="number"
              min={1}
              step={1}
              value={totalAmount}
              onChange={(ev) => setTotalAmount(ev.target.value)}
              placeholder="20000000000"
              className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">₫</span>
          </div>
          {total > 0 && (
            <p className="mt-1 text-xs text-gray-400">{formatVND(total)}</p>
          )}
          <FieldError errors={e} name="totalAmount" />
        </div>
      </div>

      {/* Lịch góp vốn */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Lịch góp vốn</h2>
        <p className="text-xs text-gray-400">
          Nhập các đợt góp vốn theo tháng dự án. Tổng góp vốn nên bằng tổng số tiền.
        </p>

        <div className="overflow-hidden rounded-lg border border-gray-100">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-500 w-24">Tháng</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-500">Số tiền (₫)</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">Mô tả</th>
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {disbursements.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={row.projectMonth}
                      onChange={(ev) => updateDisbRow(idx, "projectMonth", ev.target.value)}
                      className="w-full rounded border border-gray-200 py-1 px-2 text-xs text-slate-900 focus:border-blue-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={row.amount || ""}
                      onChange={(ev) => updateDisbRow(idx, "amount", ev.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-gray-200 py-1 px-2 text-xs text-slate-900 text-right focus:border-blue-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.description ?? ""}
                      onChange={(ev) => updateDisbRow(idx, "description", ev.target.value)}
                      placeholder="Mô tả đợt góp vốn"
                      maxLength={200}
                      className="w-full rounded border border-gray-200 py-1 px-2 text-xs text-slate-900 focus:border-blue-400 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-2">
                    {disbursements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDisbRow(idx)}
                        className="rounded p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                  className={`px-3 py-2 text-right text-xs font-bold ${
                    disbMismatch ? "text-amber-700" : "text-green-700"
                  }`}
                >
                  {formatVND(disbTotal)}
                  {disbMismatch && " ≠ tổng góp vốn"}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>

        {disbursements.length < 24 && (
          <button
            type="button"
            onClick={addDisbRow}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            + Thêm đợt góp vốn
          </button>
        )}

        <input type="hidden" name="disbursementsJson" value={disbJson} />
        <FieldError errors={e} name="disbursementsJson" />
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
          placeholder="Ghi chú về đợt góp vốn..."
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
          {isPending ? "Đang lưu..." : "Lưu góp vốn"}
        </button>
      </div>
    </form>
  );
}
