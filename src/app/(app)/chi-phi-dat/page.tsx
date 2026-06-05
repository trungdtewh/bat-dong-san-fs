import EmptyState from "@/components/ui/EmptyState";
import { MapPin } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chi phí đất | FS Dòng Tiền BĐS",
};

export default function ChiPhiDatPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Chi phí đất</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý chi phí mua đất và bồi thường giải phóng mặt bằng
        </p>
      </div>
      <EmptyState
        icon={MapPin}
        title="Chưa có chi phí đất nào"
        description="Nhập các khoản chi phí mua đất, bồi thường và tiến độ thanh toán cho từng kịch bản."
      />
    </div>
  );
}
