import { z } from "zod";

export const REVENUE_PRODUCT_TYPES = [
  "APARTMENT",
  "LAND_PLOT",
  "TOWNHOUSE",
  "SHOPHOUSE",
  "VILLA",
  "OFFICE",
  "RETAIL",
  "OTHER",
] as const;

export type RevenueProductTypeKey = (typeof REVENUE_PRODUCT_TYPES)[number];

export const REVENUE_PRODUCT_TYPE_LABELS: Record<RevenueProductTypeKey, string> = {
  APARTMENT: "Chung cư",
  LAND_PLOT: "Đất nền",
  TOWNHOUSE: "Nhà phố",
  SHOPHOUSE: "Shophouse",
  VILLA: "Biệt thự",
  OFFICE: "Văn phòng",
  RETAIL: "Thương mại",
  OTHER: "Khác",
};

export const PRICE_UNITS = ["PER_SQM", "PER_UNIT"] as const;
export type PriceUnitKey = (typeof PRICE_UNITS)[number];

export const PRICE_UNIT_LABELS: Record<PriceUnitKey, string> = {
  PER_SQM: "VND/m²",
  PER_UNIT: "VND/căn",
};

export const productGroupSchema = z
  .object({
    productCode: z.string().max(50, "Tối đa 50 ký tự").optional(),
    name: z.string().min(1, "Tên nhóm sản phẩm là bắt buộc").max(200, "Tối đa 200 ký tự"),
    productType: z.enum(REVENUE_PRODUCT_TYPES),
    totalUnits: z.coerce
      .number()
      .int("Phải là số nguyên")
      .min(1, "Phải có ít nhất 1 sản phẩm"),
    priceUnit: z.enum(PRICE_UNITS),
    area: z.coerce.number().positive("Diện tích phải lớn hơn 0").optional(),
    basePrice: z.coerce
      .number()
      .int("Giá phải là số nguyên (VND)")
      .positive("Giá bán phải lớn hơn 0"),
    vatRate: z.coerce
      .number()
      .min(0, "Thuế GTGT không được âm")
      .max(0.5, "Thuế GTGT tối đa 50%"),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.priceUnit === "PER_SQM" && !data.area) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Diện tích là bắt buộc khi đơn giá tính theo m²",
        path: ["area"],
      });
    }
  });

export type ProductGroupFormData = z.infer<typeof productGroupSchema>;
