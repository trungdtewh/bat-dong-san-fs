import { z } from "zod";

export const LAND_COST_CATEGORIES = [
  "LAND_USE_FEE",
  "LAND_LEASE_FEE",
  "COMPENSATION",
  "RELOCATION",
  "SITE_PREPARATION",
  "LEGAL_FEES",
  "TAX_AND_FEES",
  "OTHER",
] as const;

export type LandCostCategoryKey = (typeof LAND_COST_CATEGORIES)[number];

export const LAND_COST_CATEGORY_LABELS: Record<LandCostCategoryKey, string> = {
  LAND_USE_FEE: "Tiền sử dụng đất",
  LAND_LEASE_FEE: "Tiền thuê đất",
  COMPENSATION: "Bồi thường GPMB",
  RELOCATION: "Hỗ trợ tái định cư",
  SITE_PREPARATION: "San lấp mặt bằng",
  LEGAL_FEES: "Chi phí pháp lý",
  TAX_AND_FEES: "Thuế & lệ phí",
  OTHER: "Chi phí khác",
};

export const AREA_BASED_CATEGORIES = new Set<LandCostCategoryKey>([
  "LAND_USE_FEE",
  "LAND_LEASE_FEE",
  "COMPENSATION",
  "RELOCATION",
  "SITE_PREPARATION",
]);

export function isAreaBased(category: string): boolean {
  return AREA_BASED_CATEGORIES.has(category as LandCostCategoryKey);
}

export const landCostSchema = z
  .object({
    category: z.enum(LAND_COST_CATEGORIES),
    name: z
      .string()
      .min(1, "Tên mục là bắt buộc")
      .max(200, "Tối đa 200 ký tự"),
    description: z.string().optional(),
    area: z.coerce
      .number()
      .positive("Diện tích phải lớn hơn 0")
      .optional(),
    unitPrice: z.coerce
      .number()
      .int("Đơn giá phải là số nguyên")
      .positive("Đơn giá phải lớn hơn 0")
      .optional(),
    totalAmount: z.coerce
      .number()
      .int("Thành tiền phải là số nguyên")
      .positive("Thành tiền phải lớn hơn 0")
      .optional(),
    paymentMonth: z.coerce
      .number()
      .int("Phải là số nguyên")
      .min(1, "Tháng tối thiểu là 1")
      .max(600, "Tháng vượt quá giới hạn"),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (isAreaBased(data.category)) {
      if (!data.area) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Diện tích là bắt buộc",
          path: ["area"],
        });
      }
      if (!data.unitPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Đơn giá là bắt buộc",
          path: ["unitPrice"],
        });
      }
    } else {
      if (!data.totalAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Thành tiền là bắt buộc",
          path: ["totalAmount"],
        });
      }
    }
  });

export type LandCostFormData = z.infer<typeof landCostSchema>;
