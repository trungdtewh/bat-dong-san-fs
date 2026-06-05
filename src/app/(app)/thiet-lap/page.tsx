import EmptyState from "@/components/ui/EmptyState";
import { Settings } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thiết lập | FS Dòng Tiền BĐS",
};

export default function ThietLapPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Thiết lập</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cấu hình hệ thống, tài khoản người dùng và phân quyền
        </p>
      </div>
      <EmptyState
        icon={Settings}
        title="Chưa có cấu hình nào"
        description="Thiết lập thông tin tổ chức, quản lý người dùng, phân quyền dự án và các tùy chọn hệ thống."
      />
    </div>
  );
}
