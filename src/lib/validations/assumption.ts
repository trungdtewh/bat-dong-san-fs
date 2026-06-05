import { z } from "zod";

const rateField = (label: string) =>
  z.coerce
    .number()
    .min(0, `${label} không được âm`)
    .max(100, `${label} tối đa 100%`);

const optionalRate = (label: string) => rateField(label).optional();

export const assumptionSchema = z
  .object({
    // Nhóm 1: Kinh tế vĩ mô
    inflationRate: rateField("Tỷ lệ lạm phát"),
    priceEscalationRate: optionalRate("Tăng giá bán"),
    constructionEscalationRate: optionalRate("Tăng chi phí xây dựng"),
    landPriceEscalationRate: optionalRate("Tăng giá đất"),

    // Nhóm 2: Thuế & Phí
    corporateTaxRate: rateField("Thuế thu nhập DN"),
    vatRate: rateField("Thuế GTGT"),
    landTransferTaxRate: optionalRate("Thuế chuyển nhượng đất"),

    // Nhóm 3: Chi phí bán hàng
    salesCommissionRate: rateField("Phí môi giới"),
    marketingCostRate: optionalRate("Chi phí marketing"),

    // Nhóm 4: Dự phòng
    contingencyRate: rateField("Dự phòng chi phí"),

    // Nhóm 5: Cấu trúc vốn & Vay
    debtRatio: optionalRate("Tỷ lệ vốn vay"),
    equityRatio: optionalRate("Tỷ lệ vốn chủ sở hữu"),
    loanInterestRate: optionalRate("Lãi suất vay"),
    loanTenorMonths: z.coerce
      .number()
      .int("Phải là số nguyên")
      .min(1, "Tối thiểu 1 tháng")
      .max(360, "Tối đa 360 tháng")
      .optional(),
    gracePeriodMonths: z.coerce
      .number()
      .int("Phải là số nguyên")
      .min(0, "Không được âm")
      .max(360, "Tối đa 360 tháng")
      .optional(),

    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const { debtRatio, equityRatio } = data;
    if (debtRatio != null && equityRatio != null) {
      const sum = Math.round((debtRatio + equityRatio) * 100) / 100;
      if (sum !== 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Tỷ lệ vốn vay (${debtRatio}%) + vốn chủ sở hữu (${equityRatio}%) phải bằng 100%. Hiện tại: ${sum}%`,
          path: ["equityRatio"],
        });
      }
    }
  });

export type AssumptionFormData = z.infer<typeof assumptionSchema>;
