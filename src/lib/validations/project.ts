import { z } from "zod";

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  CHUNG_CU: "Chung cư",
  DAT_NEN: "Đất nền",
  NHA_PHO: "Nhà phố",
  SHOPHOUSE: "Shophouse",
  BIET_THU: "Biệt thự",
  KHU_DO_THI: "Khu đô thị",
  KHU_CONG_NGHIEP: "Khu công nghiệp",
  MIXED_USE: "Mixed-use",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  PLANNING: "Chuẩn bị đầu tư",
  IN_PROGRESS: "Đang triển khai",
  SELLING: "Đang bán hàng",
  HANDED_OVER: "Đã bàn giao",
  COMPLETED: "Đã hoàn thành",
  ON_HOLD: "Tạm dừng",
  CANCELLED: "Đã hủy",
};

export const PROVINCES = [
  "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu",
  "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông",
  "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang",
  "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", "Hòa Bình",
  "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu",
  "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định",
  "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên",
  "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị",
  "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên",
  "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang",
  "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
];

const optionalPositiveNumber = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const n = Number(val);
    return isNaN(n) ? val : n;
  },
  z.number().positive("Giá trị phải lớn hơn 0").optional()
);

export const projectSchema = z.object({
  code: z
    .string()
    .min(1, "Mã dự án là bắt buộc")
    .max(50, "Mã dự án tối đa 50 ký tự"),
  name: z
    .string()
    .min(1, "Tên dự án là bắt buộc")
    .max(200, "Tên dự án tối đa 200 ký tự"),
  type: z.enum([
    "CHUNG_CU", "DAT_NEN", "NHA_PHO", "SHOPHOUSE",
    "BIET_THU", "KHU_DO_THI", "KHU_CONG_NGHIEP", "MIXED_USE",
  ]),
  province: z
    .string()
    .min(1, "Tỉnh/Thành phố là bắt buộc")
    .max(100, "Tỉnh/Thành phố tối đa 100 ký tự"),
  status: z.enum([
    "PLANNING", "IN_PROGRESS", "SELLING", "HANDED_OVER",
    "COMPLETED", "ON_HOLD", "CANCELLED",
  ]),
  totalArea: z.coerce
    .number()
    .positive("Diện tích đất phải lớn hơn 0"),
  buildableArea: optionalPositiveNumber,
  grossFloorArea: optionalPositiveNumber,
  commercialArea: optionalPositiveNumber,
});

export type ProjectFormData = z.infer<typeof projectSchema>;
