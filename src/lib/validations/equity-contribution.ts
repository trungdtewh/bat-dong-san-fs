import { z } from "zod";
import type { DisbursementFormItem } from "./loan";
export type { DisbursementFormItem };

export const EQUITY_SOURCE_TYPES = [
  "OWNER_EQUITY",
  "JOINT_VENTURE",
  "PREFERRED_EQUITY",
  "STRATEGIC_INVESTOR",
  "OTHER",
] as const;

export const EQUITY_SOURCE_TYPE_LABELS: Record<
  (typeof EQUITY_SOURCE_TYPES)[number],
  string
> = {
  OWNER_EQUITY: "Vốn chủ sở hữu",
  JOINT_VENTURE: "Liên doanh",
  PREFERRED_EQUITY: "Vốn ưu tiên",
  STRATEGIC_INVESTOR: "Nhà đầu tư chiến lược",
  OTHER: "Loại khác",
};

export const equityContributionSchema = z.object({
  name: z
    .string()
    .min(1, "Tên đợt góp vốn là bắt buộc")
    .max(200, "Tối đa 200 ký tự"),
  contributorName: z.string().optional(),
  sourceType: z.enum(EQUITY_SOURCE_TYPES),
  totalAmount: z.coerce
    .number()
    .int("Số tiền phải là số nguyên")
    .positive("Tổng tiền góp phải lớn hơn 0"),
  disbursementsJson: z.string().min(1, "Lịch góp vốn là bắt buộc"),
  notes: z.string().optional(),
});

export type EquityContributionFormData = z.infer<typeof equityContributionSchema>;

const disbursementItemSchema = z.object({
  projectMonth: z
    .number()
    .int()
    .min(1)
    .max(600),
  amount: z.number().int().positive(),
  description: z.string().optional(),
});

export function validateEquityDisbursements(
  json: string
): { ok: true; items: DisbursementFormItem[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Lịch góp vốn không hợp lệ" };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { ok: false, error: "Phải có ít nhất 1 đợt góp vốn" };
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
