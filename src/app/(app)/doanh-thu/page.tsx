import EmptyState from "@/components/ui/EmptyState";
import { TrendingUp } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doanh thu | FS Dòng Tiền BĐS",
};

export default function DoanhThuPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Doanh thu</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý sản phẩm bán, tiến độ bán hàng và thu tiền từ khách
        </p>
      </div>
      <EmptyState
        icon={TrendingUp}
        title="Chưa có sản phẩm doanh thu nào"
        description="Thêm các loại sản phẩm (căn hộ, nền đất, shophouse...) cùng giá bán, tiến độ hấp thụ và điều khoản thu tiền."
      />
    </div>
  );
}
