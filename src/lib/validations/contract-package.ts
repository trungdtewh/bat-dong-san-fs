import { z } from "zod";

export const DISTRIBUTION_TYPES = [
  "UNIFORM",
  "S_CURVE",
  "FRONT_LOADED",
  "BACK_LOADED",
  "MANUAL",
] as const;

export type DistributionTypeKey = (typeof DISTRIBUTION_TYPES)[number];

export const DISTRIBUTION_TYPE_LABELS: Record<DistributionTypeKey, string> = {
  UNIFORM: "Đều tuyến tính",
  S_CURVE: "Đường cong S",
  FRONT_LOADED: "Nặng đầu kỳ",
  BACK_LOADED: "Nặng cuối kỳ",
  MANUAL: "Nhập thủ công",
};

export const DISTRIBUTION_TYPE_HINTS: Record<DistributionTypeKey, string> = {
  UNIFORM: "Phân bổ đều mỗi tháng",
  S_CURVE: "Chậm đầu, nhanh giữa, chậm cuối — phù hợp thi công thực tế",
  FRONT_LOADED: "60% thanh toán trong nửa đầu kỳ",
  BACK_LOADED: "60% thanh toán trong nửa cuối kỳ — nghiệm thu trước khi thanh toán",
  MANUAL: "Tự nhập tỷ lệ % từng tháng, tổng phải bằng 100%",
};

export const contractPackageSchema = z
  .object({
    name: z.string().min(1, "Tên gói thầu là bắt buộc").max(200, "Tối đa 200 ký tự"),
    contractorName: z.string().optional(),
    contractValue: z.coerce
      .number()
      .int("Phải là số nguyên")
      .positive("Giá trị hợp đồng phải lớn hơn 0"),
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
    distributionType: z.enum(DISTRIBUTION_TYPES),
    customDistribution: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.endMonth < data.startMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tháng kết thúc phải lớn hơn hoặc bằng tháng bắt đầu",
        path: ["endMonth"],
      });
      return;
    }

    if (data.distributionType === "MANUAL") {
      if (!data.customDistribution) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Vui lòng nhập phân bổ theo tháng",
          path: ["customDistribution"],
        });
        return;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(data.customDistribution);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dữ liệu phân bổ không hợp lệ",
          path: ["customDistribution"],
        });
        return;
      }
      if (!Array.isArray(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dữ liệu phân bổ phải là mảng",
          path: ["customDistribution"],
        });
        return;
      }
      const n = data.endMonth - data.startMonth + 1;
      if (parsed.length !== n) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Phải có đúng ${n} giá trị (${data.startMonth}→${data.endMonth})`,
          path: ["customDistribution"],
        });
        return;
      }
      const sum = (parsed as number[]).reduce((a, b) => a + Number(b), 0);
      if (Math.abs(sum - 100) > 0.5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Tổng tỷ lệ phải bằng 100% (hiện tại: ${sum.toFixed(1)}%)`,
          path: ["customDistribution"],
        });
      }
    }
  });

export type ContractPackageFormData = z.infer<typeof contractPackageSchema>;
