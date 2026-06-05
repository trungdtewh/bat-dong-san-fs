import { z } from "zod";

export const constructionPhaseSchema = z
  .object({
    name: z.string().min(1, "Tên giai đoạn là bắt buộc").max(200, "Tối đa 200 ký tự"),
    startMonth: z.coerce
      .number()
      .int("Phải là số nguyên")
      .min(1, "Tháng tối thiểu là 1")
      .max(600, "Tháng vượt quá giới hạn"),
    endMonth: z.coerce
      .number()
      .int("Phải là số nguyên")
      .min(1, "Tháng tối thiểu là 1")
      .max(600, "Tháng vượt quá giới hạn"),
    description: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endMonth < data.startMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tháng kết thúc phải lớn hơn hoặc bằng tháng bắt đầu",
        path: ["endMonth"],
      });
    }
  });

export type ConstructionPhaseFormData = z.infer<typeof constructionPhaseSchema>;
