"use client";

import { useState, useActionState, useMemo } from "react";
import Link from "next/link";
import {
  LOAN_TYPES,
  LOAN_TYPE_LABELS,
  LOAN_STATUSES,
  LOAN_STATUS_LABELS,
  REPAYMENT_METHODS,
  REPAYMENT_METHOD_LABELS,
} from "@/lib/validations/loan";
import type { DisbursementFormItem } from "@/lib/validations/loan";
import {
  computeAmortizationSchedule,
  computeLoanSummary,
} from "@/lib/finance/loan";
import type { LoanActionState } from "@/app/(app)/du-an/[id]/kich-ban/[scenarioId]/von-vay/actions";

export interface LoanInitialData {
  name: string;
  lenderName?: string | null;
  type: string;
  status: string;
  principalAmount: number;
  interestRatePct: number;
  tenorMonths: number;
  gracePeriodMonths: number;
  startMonth: number;
  capitalizedInterest: boolean;
  repaymentMethod: string;
  disbursements: DisbursementFormItem[];
  notes?: string | null;
}

interface Props {
  action: (prev: LoanActionState, formData: FormData) => Promise<LoanActionState>;
  initialData?: LoanInitialData;
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

export default function LoanForm({ action, initialData, cancelHref }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const e = state?.errors;

  const [principalAmount, setPrincipalAmount] = useState(
    initialData ? String(initialData.principalAmount) : ""
  );
  const [interestRatePct, setInterestRatePct] = useState(
    initialData ? String(initialData.interestRatePct) : ""
  );
  const [tenorMonths, setTenorMonths] = useState(
    initialData ? String(initialData.tenorMonths) : ""
  );
  const [gracePeriodMonths, setGracePeriodMonths] = useState(
    initialData ? String(initialData.gracePeriodMonths) : "0"
  );
  const [startMonth, setStartMonth] = useState(
    initialData ? String(initialData.startMonth) : ""
  );
  const [capitalizedInterest, setCapitalizedInterest] = useState(
    initialData?.capitalizedInterest ?? false
  );
  const [repaymentMethod, setRepaymentMethod] = useState(
    initialData?.repaymentMethod ?? "EQUAL_PRINCIPAL"
  );
  const [disbursements, setDisbursements] = useState<DisbursementFormItem[]>(
    initialData?.disbursements.length ? initialData.disbursements : DEFAULT_DISBURSEMENTS
  );
  const [showSchedule, setShowSchedule] = useState(false);

  const amortizationRows = useMemo(() => {
    const p = parseFloat(principalAmount);
    const r = parseFloat(interestRatePct);
    const t = parseInt(tenorMonths);
    const g = parseInt(gracePeriodMonths) || 0;
    const s = parseInt(startMonth) || 1;
    const validDisbs = disbursements.filter(
      (d) => d.projectMonth > 0 && d.amount > 0
    );
    if (!p || !r || !t || validDisbs.length === 0) return [];
    try {
      return computeAmortizationSchedule({
        principalAmount: p,
        interestRate: r / 100,
        tenorMonths: t,
        gracePeriodMonths: g,
        capitalizedInterest,
        repaymentMethod: repaymentMethod as Parameters<typeof computeAmortizationSchedule>[0]["repaymentMethod"],
        startMonth: s,
        disbursements: validDisbs,
      });
    } catch {
      return [];
    }
  }, [principalAmount, interestRatePct, tenorMonths, gracePeriodMonths, startMonth, capitalizedInterest, repaymentMethod, disbursements]);

  const summary = useMemo(
    () => (amortizationRows.length ? computeLoanSummary(amortizationRows) : null),
    [amortizationRows]
  );

  const disbTotal = useMemo(
    () => disbursements.reduce((s, d) => s + (d.amount || 0), 0),
    [disbursements]
  );
  const principal = parseFloat(principalAmount) || 0;
  const disbMismatch = principal > 0 && Math.abs(disbTotal - principal) > 1;

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
        <h2 className="text-sm font-semibold text-gray-700">Thông tin chung</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Tên khoản vay <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={initialData?.name}
            placeholder="Ví dụ: Vay VietinBank — Hạn mức 50 tỷ"
            maxLength={200}
            className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <FieldError errors={e} name="name" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="lenderName" className="block text-sm font-medium text-gray-700">
              Bên cho vay
            </label>
            <input
              id="lenderName"
              name="lenderName"
              type="text"
              defaultValue={initialData?.lenderName ?? undefined}
              placeholder="Tên ngân hàng / tổ chức"
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Loại vay <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              defaultValue={initialData?.type ?? "BANK_LOAN"}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {LOAN_TYPES.map((t) => (
                <option key={t} value={t}>{LOAN_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <FieldError errors={e} name="type" />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Tình trạng
            </label>
            <select
              id="status"
              name="status"
              defaultValue={initialData?.status ?? "ACTIVE"}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {LOAN_STATUSES.map((s) => (
                <option key={s} value={s}>{LOAN_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Điều khoản vay */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Điều khoản vay</h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="principalAmount" className="block text-sm font-medium text-gray-700">
              Số tiền vay <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="principalAmount"
                name="principalAmount"
                type="number"
                min={1}
                step={1}
                value={principalAmount}
                onChange={(ev) => setPrincipalAmount(ev.target.value)}
                placeholder="50000000000"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">₫</span>
            </div>
            {principal > 0 && (
              <p className="mt-1 text-xs text-gray-400">{formatVND(principal)}</p>
            )}
            <FieldError errors={e} name="principalAmount" />
          </div>

          <div>
            <label htmlFor="startMonth" className="block text-sm font-medium text-gray-700">
              Tháng bắt đầu giải ngân <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="startMonth"
                name="startMonth"
                type="number"
                min={1}
                step={1}
                value={startMonth}
                onChange={(ev) => setStartMonth(ev.target.value)}
                placeholder="1"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">tháng</span>
            </div>
            <FieldError errors={e} name="startMonth" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="interestRatePct" className="block text-sm font-medium text-gray-700">
              Lãi suất (%/năm) <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="interestRatePct"
                name="interestRatePct"
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={interestRatePct}
                onChange={(ev) => setInterestRatePct(ev.target.value)}
                placeholder="12"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">%</span>
            </div>
            <FieldError errors={e} name="interestRatePct" />
          </div>

          <div>
            <label htmlFor="tenorMonths" className="block text-sm font-medium text-gray-700">
              Kỳ hạn trả nợ <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1.5">
              <input
                id="tenorMonths"
                name="tenorMonths"
                type="number"
                min={1}
                step={1}
                value={tenorMonths}
                onChange={(ev) => setTenorMonths(ev.target.value)}
                placeholder="24"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">tháng</span>
            </div>
            <FieldError errors={e} name="tenorMonths" />
          </div>

          <div>
            <label htmlFor="gracePeriodMonths" className="block text-sm font-medium text-gray-700">
              Thời gian ân hạn
            </label>
            <div className="relative mt-1.5">
              <input
                id="gracePeriodMonths"
                name="gracePeriodMonths"
                type="number"
                min={0}
                step={1}
                value={gracePeriodMonths}
                onChange={(ev) => setGracePeriodMonths(ev.target.value)}
                placeholder="0"
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">tháng</span>
            </div>
            <FieldError errors={e} name="gracePeriodMonths" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="repaymentMethod" className="block text-sm font-medium text-gray-700">
              Phương thức trả nợ <span className="text-red-500">*</span>
            </label>
            <select
              id="repaymentMethod"
              name="repaymentMethod"
              value={repaymentMethod}
              onChange={(ev) => setRepaymentMethod(ev.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {REPAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{REPAYMENT_METHOD_LABELS[m]}</option>
              ))}
            </select>
            <FieldError errors={e} name="repaymentMethod" />
          </div>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="capitalizedInterest"
                value="true"
                checked={capitalizedInterest}
                onChange={(ev) => setCapitalizedInterest(ev.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">Vốn hóa lãi trong ân hạn</span>
                <p className="text-xs text-gray-400">Lãi trong ân hạn được cộng vào gốc</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Lịch giải ngân */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Lịch giải ngân</h2>
        <p className="text-xs text-gray-400">
          Nhập các đợt giải ngân theo tháng dự án. Tổng giải ngân nên bằng số tiền vay.
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
                      placeholder="Mô tả đợt giải ngân"
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
                  {disbMismatch && " ≠ số tiền vay"}
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
            + Thêm đợt giải ngân
          </button>
        )}

        <input type="hidden" name="disbursementsJson" value={disbJson} />
        <FieldError errors={e} name="disbursementsJson" />
      </div>

      {/* Xem trước bảng trả nợ */}
      {amortizationRows.length > 0 && summary && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSchedule((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-sm font-semibold text-gray-700">
              Xem trước bảng trả nợ ({amortizationRows.length} tháng)
            </h2>
            <span className="text-xs text-gray-400">{showSchedule ? "Thu gọn ▲" : "Mở rộng ▼"}</span>
          </button>

          <div className="border-t border-gray-100 px-6 py-3 grid grid-cols-2 gap-4 sm:grid-cols-4 bg-blue-50">
            <div>
              <p className="text-xs text-blue-500">Tổng giải ngân</p>
              <p className="text-sm font-bold text-blue-900">{formatVND(summary.totalDisbursed)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-500">Tổng lãi phải trả</p>
              <p className="text-sm font-bold text-blue-900">{formatVND(summary.totalInterest)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-500">Tổng gốc trả</p>
              <p className="text-sm font-bold text-blue-900">{formatVND(summary.totalPrincipalRepaid)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-500">Tổng thanh toán</p>
              <p className="text-sm font-bold text-blue-900">{formatVND(summary.totalPayment)}</p>
            </div>
          </div>

          {showSchedule && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 border-t border-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-center font-semibold text-gray-500">Tháng</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Dư nợ đầu kỳ</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Giải ngân</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Trả gốc</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Lãi vay</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Tổng trả</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-500">Dư nợ cuối kỳ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {amortizationRows.map((row) => (
                    <tr key={row.projectMonth} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-center text-gray-600">T{row.projectMonth}</td>
                      <td className="px-3 py-1.5 text-right text-gray-700">
                        {row.openingBalance > 0 ? formatVND(row.openingBalance) : "—"}
                      </td>
                      <td className={`px-3 py-1.5 text-right ${row.disbursement > 0 ? "text-green-700 font-medium" : "text-gray-300"}`}>
                        {row.disbursement > 0 ? formatVND(row.disbursement) : "—"}
                      </td>
                      <td className={`px-3 py-1.5 text-right ${row.principalRepayment > 0 ? "text-red-600" : "text-gray-300"}`}>
                        {row.principalRepayment > 0 ? formatVND(row.principalRepayment) : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right text-orange-700">
                        {row.interest > 0 ? formatVND(row.interest) : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium text-gray-800">
                        {row.totalPayment > 0 ? formatVND(row.totalPayment) : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-700">
                        {formatVND(row.closingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
          placeholder="Ghi chú về khoản vay..."
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
          {isPending ? "Đang lưu..." : "Lưu khoản vay"}
        </button>
      </div>
    </form>
  );
}
