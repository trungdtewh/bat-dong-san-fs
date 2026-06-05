import { z } from "zod";

export const SCENARIO_TYPE_LABELS: Record<string, string> = {
  BASE: "Cơ sở",
  OPTIMISTIC: "Lạc quan",
  PESSIMISTIC: "Bi quan",
  CUSTOM: "Tùy chỉnh",
};

export const scenarioSchema = z.object({
  name: z
    .string()
    .min(1, "Tên kịch bản là bắt buộc")
    .max(200, "Tên kịch bản tối đa 200 ký tự"),
  type: z.enum(["BASE", "OPTIMISTIC", "PESSIMISTIC", "CUSTOM"]),
  isBase: z.boolean().default(false),
  description: z.string().optional(),
  durationMonths: z.coerce
    .number()
    .int("Phải là số nguyên")
    .min(1, "Tối thiểu 1 tháng")
    .max(600, "Tối đa 600 tháng")
    .optional(),
  constructionStartMonth: z.coerce
    .number()
    .int("Phải là số nguyên")
    .min(1, "Tối thiểu tháng 1")
    .max(600, "Tháng không hợp lệ")
    .optional(),
  salesStartMonth: z.coerce
    .number()
    .int("Phải là số nguyên")
    .min(1, "Tối thiểu tháng 1")
    .max(600, "Tháng không hợp lệ")
    .optional(),
  handoverStartMonth: z.coerce
    .number()
    .int("Phải là số nguyên")
    .min(1, "Tối thiểu tháng 1")
    .max(600, "Tháng không hợp lệ")
    .optional(),
  discountRate: z.coerce
    .number()
    .min(0, "Tỷ lệ không được âm")
    .max(100, "Tỷ lệ tối đa 100%")
    .optional(),
});

export type ScenarioFormData = z.infer<typeof scenarioSchema>;
