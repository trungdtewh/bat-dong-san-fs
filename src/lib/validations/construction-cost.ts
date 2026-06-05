import { z } from "zod";

export const CONSTRUCTION_COST_CATEGORIES = [
  "FOUNDATION",
  "STRUCTURE",
  "MEP",
  "FINISHING",
  "INFRASTRUCTURE",
  "PROFESSIONAL_FEES",
  "MANAGEMENT",
  "CONTINGENCY",
  "OTHER",
] as const;

export type ConstructionCostCategoryKey =
  (typeof CONSTRUCTION_COST_CATEGORIES)[number];

export const CONSTRUCTION_COST_CATEGORY_LABELS: Record<
  ConstructionCostCategoryKey,
  string
> = {
  FOUNDATION: "Móng & hầm",
  STRUCTURE: "Kết cấu",
  MEP: "Cơ điện (M&E)",
  FINISHING: "Hoàn thiện",
  INFRASTRUCTURE: "Hạ tầng kỹ thuật",
  PROFESSIONAL_FEES: "Tư vấn & thiết kế",
  MANAGEMENT: "Quản lý dự án",
  CONTINGENCY: "Dự phòng",
  OTHER: "Chi phí khác",
};

export const constructionCostSchema = z
  .object({
    category: z.enum(CONSTRUCTION_COST_CATEGORIES),
    name: z
      .string()
      .min(1, "Tên hạng mục là bắt buộc")
      .max(200, "Tối đa 200 ký tự"),
    description: z.string().optional(),
    unit: z.string().max(20, "Tối đa 20 ký tự").optional(),
    quantity: z.coerce.number().positive("Khối lượng phải lớn hơn 0").optional(),
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
    inputMode: z.enum(["quantity", "fixed"]),
  })
  .superRefine((data, ctx) => {
    if (data.inputMode === "quantity") {
      if (!data.quantity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Khối lượng là bắt buộc",
          path: ["quantity"],
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

export type ConstructionCostFormData = z.infer<typeof constructionCostSchema>;
