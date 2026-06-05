import EmptyState from "@/components/ui/EmptyState";
import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Báo cáo | FS Dòng Tiền BĐS",
};

export default function BaoCaoPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Báo cáo</h1>
        <p className="mt-1 text-sm text-gray-500">
          Xuất báo cáo tài chính và phân tích đầu tư
        </p>
      </div>
      <EmptyState
        icon={BarChart3}
        title="Chưa có báo cáo nào"
        description="Tạo báo cáo phân tích tài chính, bảng dòng tiền và chỉ tiêu đầu tư (IRR, NPV, ROI) sau khi dữ liệu đã đầy đủ."
      />
    </div>
  );
}
