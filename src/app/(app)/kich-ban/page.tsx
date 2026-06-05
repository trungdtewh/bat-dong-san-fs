import EmptyState from "@/components/ui/EmptyState";
import { GitBranch } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kịch bản | FS Dòng Tiền BĐS",
};

export default function KichBanPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Kịch bản</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý và so sánh các kịch bản tài chính của dự án
        </p>
      </div>
      <EmptyState
        icon={GitBranch}
        title="Chưa có kịch bản nào"
        description="Tạo các kịch bản cơ sở, lạc quan và bi quan để so sánh hiệu quả đầu tư trong các điều kiện khác nhau."
      />
    </div>
  );
}
