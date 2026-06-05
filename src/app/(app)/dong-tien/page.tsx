import EmptyState from "@/components/ui/EmptyState";
import { Activity } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dòng tiền | FS Dòng Tiền BĐS",
};

export default function DongTienPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dòng tiền</h1>
        <p className="mt-1 text-sm text-gray-500">
          Phân tích dòng tiền thu chi theo từng tháng của dự án
        </p>
      </div>
      <EmptyState
        icon={Activity}
        title="Chưa có dữ liệu dòng tiền"
        description="Dòng tiền sẽ được tính tự động sau khi nhập đầy đủ chi phí đất, chi phí xây dựng, doanh thu và vốn vay."
      />
    </div>
  );
}
