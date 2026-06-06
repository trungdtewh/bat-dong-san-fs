import { z } from "zod";

export interface CollectionInstallment {
  percent: number;
  offsetMonths: number;
  label: string;
}

export const COLLECTION_PRESETS: Record<string, { label: string; schedule: CollectionInstallment[] }> = {
  STANDARD_5: {
    label: "5 đợt chuẩn (30/20/20/20/10)",
    schedule: [
      { percent: 30, offsetMonths: 0,  label: "Ký hợp đồng mua bán" },
      { percent: 20, offsetMonths: 6,  label: "Hoàn thành phần móng" },
      { percent: 20, offsetMonths: 12, label: "Hoàn thành phần thân" },
      { percent: 20, offsetMonths: 18, label: "Bàn giao nhà" },
      { percent: 10, offsetMonths: 24, label: "Nhận giấy chứng nhận" },
    ],
  },
  SIMPLE_3: {
    label: "3 đợt đơn giản (50/30/20)",
    schedule: [
      { percent: 50, offsetMonths: 0,  label: "Ký hợp đồng mua bán" },
      { percent: 30, offsetMonths: 6,  label: "Hoàn thành xây dựng" },
      { percent: 20, offsetMonths: 12, label: "Bàn giao nhà" },
    ],
  },
  ONE_TIME: {
    label: "Thanh toán 1 lần",
    schedule: [
      { percent: 100, offsetMonths: 0, label: "Thanh toán toàn bộ" },
    ],
  },
};

const installmentSchema = z.object({
  percent: z.number().positive("Tỷ lệ mỗi đợt phải lớn hơn 0"),
  offsetMonths: z
    .number()
    .int("Tháng thu phải là số nguyên")
    .min(0, "Tháng thu không được âm"),
  label: z.string().min(1, "Nhãn đợt thu là bắt buộc").max(100, "Tối đa 100 ký tự"),
});

export const productBatchSchema = z
  .object({
    name: z.string().min(1, "Tên đợt mở bán là bắt buộc").max(200, "Tối đa 200 ký tự"),
    launchMonth: z.coerce
      .number()
      .int("Phải là số nguyên")
      .min(1, "Tháng tối thiểu là 1")
      .max(600, "Tháng vượt quá giới hạn"),
    unitsOffered: z.coerce
      .number()
      .int("Phải là số nguyên")
      .min(1, "Phải mở bán ít nhất 1 sản phẩm"),
    priceAdjustmentRate: z.coerce
      .number()
      .min(-0.9999, "Giảm giá tối đa 99.99%")
      .max(5, "Tăng giá tối đa 500%"),
    salesVelocity: z.coerce
      .number()
      .positive("Tốc độ hấp thụ phải lớn hơn 0")
      .max(9999, "Tốc độ hấp thụ vượt quá giới hạn"),
    collectionScheduleJson: z.string().min(1, "Tiến độ thu tiền là bắt buộc"),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data.collectionScheduleJson);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tiến độ thu tiền không hợp lệ",
        path: ["collectionScheduleJson"],
      });
      return;
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tiến độ thu tiền là bắt buộc",
        path: ["collectionScheduleJson"],
      });
      return;
    }
    if (parsed.length > 24) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tối đa 24 đợt thu tiền",
        path: ["collectionScheduleJson"],
      });
      return;
    }
    for (let i = 0; i < parsed.length; i++) {
      const result = installmentSchema.safeParse(parsed[i]);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Đợt ${i + 1}: ${result.error.issues[0]?.message ?? "Không hợp lệ"}`,
          path: ["collectionScheduleJson"],
        });
        return;
      }
    }
    const total = (parsed as CollectionInstallment[]).reduce(
      (s, item) => s + item.percent,
      0
    );
    if (Math.abs(total - 100) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Tổng tỷ lệ phải bằng 100% (hiện tại: ${total.toFixed(2)}%)`,
        path: ["collectionScheduleJson"],
      });
    }
  });

export type ProductBatchFormData = z.infer<typeof productBatchSchema>;
