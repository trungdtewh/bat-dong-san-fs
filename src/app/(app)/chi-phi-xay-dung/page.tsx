import EmptyState from "@/components/ui/EmptyState";
import { Hammer } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chi phí xây dựng | FS Dòng Tiền BĐS",
};

export default function ChiPhiXayDungPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Chi phí xây dựng
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý chi phí thi công theo từng giai đoạn và hạng mục
        </p>
      </div>
      <EmptyState
        icon={Hammer}
        title="Chưa có chi phí xây dựng nào"
        description="Nhập chi phí xây dựng theo giai đoạn thi công: phần móng, phần thân, hoàn thiện và các hạng mục khác."
      />
    </div>
  );
}
