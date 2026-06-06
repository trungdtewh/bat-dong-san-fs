import { z } from "zod";

export const LOAN_TYPES = [
  "BANK_LOAN",
  "BOND",
  "EQUITY_PARTNER",
  "MEZZANINE",
  "OTHER",
] as const;

export const LOAN_TYPE_LABELS: Record<(typeof LOAN_TYPES)[number], string> = {
  BANK_LOAN: "Vay ngân hàng",
  BOND: "Trái phiếu",
  EQUITY_PARTNER: "Đối tác vốn",
  MEZZANINE: "Vay mezzanine",
  OTHER: "Loại khác",
};

export const LOAN_STATUSES = ["ACTIVE", "REPAID", "CANCELLED"] as const;

export const LOAN_STATUS_LABELS: Record<(typeof LOAN_STATUSES)[number], string> = {
  ACTIVE: "Đang hoạt động",
  REPAID: "Đã trả hết",
  CANCELLED: "Đã hủy",
};

export const REPAYMENT_METHODS = [
  "EQUAL_PRINCIPAL",
  "ANNUITY",
  "BULLET",
  "CUSTOM",
] as const;

export const REPAYMENT_METHOD_LABELS: Record<
  (typeof REPAYMENT_METHODS)[number],
  string
> = {
  EQUAL_PRINCIPAL: "Trả gốc đều",
  ANNUITY: "Trả đều (niên kim)",
  BULLET: "Trả hết cuối kỳ",
  CUSTOM: "Tự nhập lịch",
};

export interface DisbursementFormItem {
  projectMonth: number;
  amount: number;
  description?: string;
}

const disbursementItemSchema = z.object({
  projectMonth: z
    .number()
    .int("Tháng phải là số nguyên")
    .min(1, "Tháng tối thiểu là 1")
    .max(600, "Tháng vượt quá giới hạn"),
  amount: z
    .number()
    .int("Số tiền phải là số nguyên")
    .positive("Số tiền phải lớn hơn 0"),
  description: z.string().optional(),
});

export const loanSchema = z.object({
  name: z.string().min(1, "Tên khoản vay là bắt buộc").max(200, "Tối đa 200 ký tự"),
  lenderName: z.string().optional(),
  type: z.enum(LOAN_TYPES),
  status: z.enum(LOAN_STATUSES),
  principalAmount: z.coerce
    .number()
    .int("Số tiền phải là số nguyên")
    .positive("Số tiền vay phải lớn hơn 0"),
  interestRatePct: z.coerce
    .number()
    .positive("Lãi suất phải lớn hơn 0")
    .max(100, "Lãi suất tối đa 100%/năm"),
  tenorMonths: z.coerce
    .number()
    .int("Kỳ hạn phải là số nguyên")
    .min(1, "Kỳ hạn tối thiểu 1 tháng")
    .max(600, "Kỳ hạn tối đa 600 tháng"),
  gracePeriodMonths: z.coerce
    .number()
    .int("Ân hạn phải là số nguyên")
    .min(0, "Ân hạn không được âm")
    .max(120, "Ân hạn tối đa 120 tháng")
    .default(0),
  startMonth: z.coerce
    .number()
    .int("Tháng phải là số nguyên")
    .min(1, "Tháng tối thiểu là 1")
    .max(600, "Tháng vượt quá giới hạn"),
  capitalizedInterest: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "on"),
  repaymentMethod: z.enum(REPAYMENT_METHODS),
  disbursementsJson: z.string().min(1, "Lịch giải ngân là bắt buộc"),
  notes: z.string().optional(),
});

export type LoanFormData = z.infer<typeof loanSchema>;

export function parseDisbursements(json: string): DisbursementFormItem[] {
  try {
    return JSON.parse(json) as DisbursementFormItem[];
  } catch {
    return [];
  }
}

export function validateDisbursements(
  json: string
): { ok: true; items: DisbursementFormItem[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Lịch giải ngân không hợp lệ" };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { ok: false, error: "Phải có ít nhất 1 đợt giải ngân" };
  }
  for (let i = 0; i < parsed.length; i++) {
    const r = disbursementItemSchema.safeParse(parsed[i]);
    if (!r.success) {
      return {
        ok: false,
        error: `Đợt ${i + 1}: ${r.error.issues[0]?.message ?? "Không hợp lệ"}`,
      };
    }
  }
  return { ok: true, items: parsed as DisbursementFormItem[] };
}
