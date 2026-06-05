import EmptyState from "@/components/ui/EmptyState";
import { LayoutDashboard } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tổng quan | FS Dòng Tiền BĐS",
};

export default function TongQuanPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tổng quan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Thông tin tổng hợp về tình hình tài chính dự án
        </p>
      </div>
      <EmptyState
        icon={LayoutDashboard}
        title="Chưa có dữ liệu tổng quan"
        description="Các chỉ tiêu tài chính, biểu đồ dòng tiền và KPI sẽ hiển thị tại đây sau khi dự án được thiết lập đầy đủ."
      />
    </div>
  );
}
